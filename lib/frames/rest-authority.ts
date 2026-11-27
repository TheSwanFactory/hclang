/** Pure REST authorization and shared ancestor state, used by worker and simulator. @module */
import {
  requestHeaders,
  requestUrl,
  type RestEvidenceStub,
  type RestGrantPolicy,
  restGrantPolicy,
  type RestGrantSpec,
  type RestInput,
  type RestOutgoing,
  withinBase,
} from "./rest-policy.ts";

/** Harness-only narrowing; omitted fields inherit. */
export type RestNarrowing = Partial<Omit<RestGrantSpec, "base">> & {
  readonly path?: string;
};

/** Derives a child policy without adding authority. */
export function attenuateRestPolicy(
  parent: RestGrantPolicy,
  narrow: RestNarrowing,
): RestGrantPolicy {
  const resolved = requestUrl(parent.base, narrow.path, []);
  if (!resolved.ok) throw new TypeError(`REST attenuation: ${resolved.reason}`);
  const base = narrow.path === undefined || narrow.path === ""
    ? parent.base
    : resolved.url.replace(/\/?$/, "/");
  const requested = restGrantPolicy({ ...parent, ...narrow, base });
  const minimum = (
    key:
      | "requests"
      | "requestBytes"
      | "responseBytes"
      | "timeoutMs"
      | "lifetimeMs",
  ): number => Math.min(parent[key], requested[key]);
  return Object.freeze({
    ...requested,
    methods: Object.freeze(
      parent.methods.filter((method) => requested.methods.includes(method)),
    ),
    requestHeaders: Object.freeze(
      parent.requestHeaders.filter((name) =>
        requested.requestHeaders.includes(name)
      ),
    ),
    responseHeaders: Object.freeze(
      parent.responseHeaders.filter((name) =>
        requested.responseHeaders.includes(name)
      ),
    ),
    requests: minimum("requests"),
    requestBytes: minimum("requestBytes"),
    responseBytes: minimum("responseBytes"),
    timeoutMs: minimum("timeoutMs"),
    lifetimeMs: minimum("lifetimeMs"),
  });
}

/** A decision includes the evidence stub even when refused. */
export type RestPrepared =
  | {
    readonly ok: true;
    readonly request: RestOutgoing;
    readonly stub: RestEvidenceStub;
  }
  | {
    readonly ok: false;
    readonly reason: string;
    readonly stub: RestEvidenceStub;
  };

/** The single state owner for a grant; descendants reference this exact object. */
export class RestAuthority {
  public sent = 0;
  public revoked = false;
  public readonly expiresAt: number;
  public constructor(
    public readonly policy: RestGrantPolicy,
    public readonly now: () => number = Date.now,
    public readonly id: string = policy.base,
    public readonly parent?: RestAuthority,
  ) {
    this.expiresAt = Math.min(
      parent?.expiresAt ?? Infinity,
      now() + policy.lifetimeMs,
    );
  }
  /** Checks a canonical request against the entire chain, then spends every counter. */
  public prepare(input: RestInput): RestPrepared {
    const at = this.now();
    const method = input.ok ? input.request.method ?? "GET" : "GET";
    let stub: RestEvidenceStub = {
      grant: this.policy.base,
      at: new Date(at).toISOString(),
      method,
      url: null,
    };
    const refuse = (reason: string): RestPrepared => ({
      ok: false,
      reason,
      stub,
    });
    const chain: RestAuthority[] = [this];
    for (let parent = this.parent; parent; parent = parent.parent) {
      chain.push(parent);
    }
    for (const grant of chain) {
      if (grant.revoked) return refuse("resource-revoked");
      if (at > grant.expiresAt) return refuse("resource-budget lifetime");
    }
    if (!input.ok) return refuse(input.reason);
    const raw = input.request;
    if (
      Object.keys(raw).some((key) =>
        !["path", "query", "headers", "method", "body"].includes(key)
      ) ||
      typeof method !== "string" ||
      (raw.path !== undefined && typeof raw.path !== "string") ||
      (raw.body !== undefined && typeof raw.body !== "string") ||
      ![raw.query, raw.headers].every((pairs) =>
        Array.isArray(pairs) &&
        pairs.every((pair) =>
          Array.isArray(pair) && pair.length === 2 &&
          pair.every((value) => typeof value === "string")
        )
      )
    ) {
      return refuse("resource-request-shape");
    }
    const url = requestUrl(this.policy.base, raw.path, raw.query);
    if (!url.ok) return refuse(url.reason);
    stub = { ...stub, url: url.url };
    const size = new TextEncoder().encode(raw.body ?? "").length;
    if (raw.body !== undefined && !["POST", "PUT", "PATCH"].includes(method)) {
      return refuse("resource-request-shape");
    }
    for (const grant of chain) {
      if (!withinBase(grant.policy.base, url.url)) {
        return refuse("resource-escaped-root");
      }
      if (!grant.policy.methods.includes(method)) {
        return refuse("resource-method-forbidden");
      }
      if (size > grant.policy.requestBytes) {
        return refuse("resource-budget request-size");
      }
      const headers = requestHeaders(grant.policy, raw.headers);
      if (!headers.ok) return refuse(headers.reason);
      if (grant.sent >= grant.policy.requests) {
        return refuse("resource-budget requests");
      }
    }
    const checked = requestHeaders(this.policy, raw.headers);
    if (!checked.ok) return refuse(checked.reason);
    for (const grant of chain) grant.sent++;
    return {
      ok: true,
      stub,
      request: {
        url: url.url,
        method,
        body: raw.body,
        headers: checked.headers,
        timeoutMs: Math.min(...chain.map((grant) => grant.policy.timeoutMs)),
        responseBytes: Math.min(
          ...chain.map((grant) => grant.policy.responseBytes),
        ),
      },
    };
  }
}
