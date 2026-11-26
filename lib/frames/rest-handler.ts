/**
 * The REST resource: grants, and the `https` handler table entry that holds
 * them.
 *
 * A program reaches a grant only by writing its base as a resource literal,
 * `'https://api.github.com/repos/TheSwanFactory/hclang/'`, and applying that
 * resource to a request record. The record is read here, checked by the pure
 * policy in `rest-policy.ts`, and only then handed to the grant's transport.
 * The answer is an ordinary record of strings and a Count, so no authority
 * ever comes back out.
 *
 * Every application produces exactly one evidence record, whether the request
 * was sent or refused, and a refusal goes through the transport's own evidence
 * channel. A grant whose evidence cannot be appended answers
 * `$!.resource-evidence`, so the system fails closed.
 *
 * Installation is harness-only, as for every handler: a grant is a TypeScript
 * value, and HC has no spelling that creates, widens, revokes or enumerates
 * one. `spec/a20-rest-resource.md` records the design.
 *
 * @module
 */
import "./frame-lazy.ts";
import { Frame } from "./frame.ts";
import { FrameArray } from "./frame-array.ts";
import { FrameCount } from "./frame-count.ts";
import { FrameString } from "./frame-string.ts";
import {
  characterElements,
  type HandlerExchange,
  type HandlerRead,
  type HandlerWrite,
  type SchemeHandler,
} from "./resource-handlers.ts";
import type { ReferenceParts } from "./resource-reference.ts";
import {
  namesGrant,
  requestHeaders,
  requestUrl,
  responseHeaders,
  REST_METHOD,
  type RestEvidence,
  type RestEvidenceStub,
  type RestGrantPolicy,
  restGrantPolicy,
  type RestGrantSpec,
  type RestRefusal,
  type RestTransport,
} from "./rest-policy.ts";
/** The keys a request record may hold in the MVP. */
const REQUEST_KEYS = new Set(["path", "query", "headers"]);
/** One request, read out of its record. */
export interface RestRequest {
  readonly path?: string;
  readonly query: readonly (readonly [string, string])[];
  readonly headers: readonly (readonly [string, string])[];
}
/** One response, before it becomes a record. */
export interface RestResponse {
  readonly status: number;
  readonly headers: Readonly<Record<string, string>>;
  readonly body: string;
}
/** A grant's answer to one request. */
export type RestOutcome =
  | { readonly ok: true; readonly response: RestResponse }
  | RestRefusal;
const shape: RestRefusal = { ok: false, reason: "resource-request-shape" };
/** The string a value holds, or undefined when it is not a string. */
const stringValue = (frame: Frame): string | undefined => {
  const value = frame.referent();
  return value instanceof FrameString ? value.characterContent() : undefined;
};
/** A record: an aggregate with properties and no elements. */
const recordOf = (frame: Frame): FrameArray | undefined => {
  const value = frame.referent();
  return value instanceof FrameArray && value.elements().length === 0
    ? value
    : undefined;
};
/** A record whose every property is a string, as name-value pairs. */
const stringPairs = (
  frame: Frame,
): (readonly [string, string])[] | undefined => {
  const record = recordOf(frame);
  if (record === undefined) return undefined;
  const pairs: (readonly [string, string])[] = [];
  for (const key of record.visibleKeys()) {
    const value = stringValue(record.getOwn(key));
    if (value === undefined) return undefined;
    pairs.push([key, value]);
  }
  return pairs;
};
/**
 * Reads a request record, or refuses its shape.
 *
 * Every key is optional, and any key outside `.path`, `.query` and `.headers`
 * answers `resource-request-shape`, which includes `.method` and `.body`: the
 * MVP sends public `GET`s only. A value that is not a record, or a record
 * holding elements, is refused the same way, so applying a string is never a
 * write.
 *
 * @param frame The argument the resource was applied to.
 */
export function readRequest(
  frame: Frame,
): { readonly ok: true; readonly request: RestRequest } | RestRefusal {
  const record = recordOf(frame);
  if (record === undefined) return shape;
  const keys = record.visibleKeys();
  if (keys.some((key) => !REQUEST_KEYS.has(key))) return shape;
  let path: string | undefined;
  if (keys.includes("path")) {
    path = stringValue(record.getOwn("path"));
    if (path === undefined) return shape;
  }
  const query = keys.includes("query")
    ? stringPairs(record.getOwn("query"))
    : [];
  const headers = keys.includes("headers")
    ? stringPairs(record.getOwn("headers"))
    : [];
  if (query === undefined || headers === undefined) return shape;
  return { ok: true, request: { path, query, headers } };
}
/**
 * A response as an ordinary HC record.
 *
 * `.status` is a Count, `.headers` a record of strings and `.body` a string,
 * so nothing a program receives carries authority.
 *
 * @param response The response a grant released.
 */
export function responseRecord(response: RestResponse): Frame {
  const headers: Record<string, Frame> = {};
  for (const [name, value] of Object.entries(response.headers)) {
    headers[name] = new FrameString(value);
  }
  return new FrameArray([], {
    status: FrameCount.for(response.status.toString()),
    headers: new FrameArray([], headers),
    body: new FrameString(response.body),
  });
}
/**
 * One grant: a base URI, its budgets, and the transport that sends for it.
 *
 * The request and lifetime budgets are counted here; the response-size and
 * timeout budgets are enforced by the transport while it receives. There are no
 * retries, so the retry budget is zero by construction, and a transport failure
 * still spends a request.
 */
export class RestGrant {
  public readonly policy: RestGrantPolicy;
  private readonly created: number;
  private sent = 0;
  private revoked = false;
  /**
   * @param spec The grant as the harness wrote it, checked by `restGrantPolicy`.
   * @param transport How this grant sends, simulated or live.
   * @param now The harness's clock in epoch milliseconds, for `at` and lifetime.
   */
  public constructor(
    spec: RestGrantSpec,
    private readonly transport: RestTransport,
    private readonly now: () => number = Date.now,
  ) {
    this.policy = restGrantPolicy(spec);
    this.created = now();
  }
  /** The base URI a literal names this grant by. */
  public get base(): string {
    return this.policy.base;
  }
  /** Requests sent so far, for a harness or a test. */
  public requestsSent(): number {
    return this.sent;
  }
  /** Ends this grant: every later application answers `resource-revoked`. */
  public revoke(): void {
    this.revoked = true;
  }
  /** This grant's identity, for a harness or a test, never for a program. */
  public describe(): string {
    return `${this.policy.base} via ${this.transport.describe()}`;
  }
  /**
   * Decides one application and, when it passes, sends it.
   *
   * @param request The request record already read, or its shape refusal.
   */
  public exchange(
    request: { readonly ok: true; readonly request: RestRequest } | RestRefusal,
  ): RestOutcome {
    const at = this.now();
    const stub: RestEvidenceStub = {
      grant: this.policy.base,
      at: new Date(at).toISOString(),
      method: REST_METHOD,
      url: null,
    };
    if (this.revoked) return this.refuse(stub, "resource-revoked");
    if (at - this.created > this.policy.lifetimeMs) {
      return this.refuse(stub, "resource-budget lifetime");
    }
    if (!request.ok) return this.refuse(stub, request.reason);
    const url = requestUrl(
      this.policy.base,
      request.request.path,
      request.request.query,
    );
    if (!url.ok) return this.refuse(stub, url.reason);
    const located = { ...stub, url: url.url };
    const headers = requestHeaders(this.policy, request.request.headers);
    if (!headers.ok) return this.refuse(located, headers.reason);
    if (this.sent >= this.policy.requests) {
      return this.refuse(located, "resource-budget requests");
    }
    this.sent += 1;
    const sent = this.transport.send({
      url: url.url,
      headers: headers.headers,
      timeoutMs: this.policy.timeoutMs,
      responseBytes: this.policy.responseBytes,
    }, located);
    if (!sent.ok) return sent;
    return {
      ok: true,
      response: {
        status: sent.status,
        headers: responseHeaders(this.policy, Object.entries(sent.headers)),
        body: sent.body,
      },
    };
  }
  /**
   * Records a literal that names no grant, through this grant's channel.
   *
   * The record's `grant` is null, because no grant was reached.
   */
  public refuseUnbound(): RestRefusal {
    return this.refuse({
      grant: null,
      at: new Date(this.now()).toISOString(),
      method: REST_METHOD,
      url: null,
    }, "resource-unbound");
  }
  /** Records a refusal decided before any transport call. */
  private refuse(stub: RestEvidenceStub, reason: string): RestRefusal {
    const record: RestEvidence = {
      ...stub,
      outcome: "refused",
      status: null,
      responseBytes: 0,
      refusal: reason,
    };
    return this.transport.record(record)
      ? { ok: false, reason }
      : { ok: false, reason: "resource-evidence" };
  }
}
/** The literal a decomposed reference was written as. */
const literalOf = (parts: ReferenceParts): string =>
  `${parts.scheme ?? ""}:` +
  (parts.authority === undefined ? "" : `//${parts.authority}`) +
  (parts.path ?? "") +
  (parts.query === undefined ? "" : `?${parts.query}`) +
  (parts.fragment === undefined ? "" : `#${parts.fragment}`);
/**
 * The handler table entry that holds a harness's REST grants.
 *
 * A literal must equal a grant's base exactly; any other literal under the
 * scheme, another origin or a sub-path of a grant alike, answers
 * `resource-unbound`. That refusal has no grant of its own, so its evidence
 * goes through the first grant's channel, which is the table's.
 */
export class RestHandler implements SchemeHandler {
  private readonly grants: readonly RestGrant[];
  /** @param grants The grants this entry serves, at least one. */
  public constructor(grants: readonly RestGrant[]) {
    if (grants.length === 0) {
      throw new TypeError("A REST handler needs at least one grant");
    }
    const bases = new Set(grants.map((grant) => grant.base));
    if (bases.size !== grants.length) {
      throw new TypeError("REST grants must have distinct bases");
    }
    this.grants = Object.freeze([...grants]);
  }
  public describe(): string {
    return `rest ${this.grants.map((grant) => grant.describe()).join(", ")}`;
  }
  /** The grants, for a harness or a test, never for a program. */
  public grantList(): readonly RestGrant[] {
    return this.grants;
  }
  /**
   * A read is a `GET` of the base, answered as characters.
   *
   * A 404 answers `resource-absent`, and any other status outside 2xx answers
   * `resource-status <code>`.
   */
  public read(reference: ReferenceParts): HandlerRead {
    const grant = this.grantFor(reference);
    if (!grant.ok) return grant;
    const answered = grant.grant.exchange({
      ok: true,
      request: { query: [], headers: [] },
    });
    if (!answered.ok) return answered;
    const status = answered.response.status;
    if (status === 404) return { ok: false, reason: "resource-absent" };
    if (status < 200 || status > 299) {
      return { ok: false, reason: `resource-status ${status}` };
    }
    return { ok: true, elements: characterElements(answered.response.body) };
  }
  /** Application is one `GET`, answered as a response record. */
  public exchange(reference: ReferenceParts, request: Frame): HandlerExchange {
    const grant = this.grantFor(reference);
    if (!grant.ok) return grant;
    const answered = grant.grant.exchange(readRequest(request));
    return answered.ok
      ? { ok: true, response: responseRecord(answered.response) }
      : answered;
  }
  /** Writing is not a REST verb in the MVP; application sends instead. */
  public write(reference: ReferenceParts, _content: string): HandlerWrite {
    const grant = this.grantFor(reference);
    if (!grant.ok) return grant;
    return grant.grant.exchange(shape) as RestRefusal;
  }
  /** The grant a literal names, or the recorded `resource-unbound`. */
  private grantFor(
    reference: ReferenceParts,
  ): { readonly ok: true; readonly grant: RestGrant } | RestRefusal {
    const literal = literalOf(reference);
    const grant = this.grants.find((each) => namesGrant(each.base, literal));
    if (grant !== undefined) return { ok: true, grant };
    return this.grants[0].refuseUnbound();
  }
}
