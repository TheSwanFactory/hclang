/** Worker-owned REST authority and synchronous host bridge. @module */
import { RestAuthority } from "../lib/frames/rest-authority.ts";
import {
  isRestEffect,
  responseHeaders,
  type RestEvidence,
  type RestEvidenceStub,
  type RestGrantPolicy,
  type RestInput,
  type RestOutgoing,
  type RestTransport,
  type RestTransportResult,
  withinBase,
} from "../lib/frames/rest-policy.ts";
const WORKER_NAME = "hc-rest-transport";
const HEADER_BYTES = 12;
const META_CAPACITY = 64 * 1024;
const WAIT_MARGIN_MS = 10_000;
const RECORD_WAIT_MS = 10_000;
const PENDING = 0;
const ANSWERED = 1;
const encoder = new TextEncoder();
/** Trusted, worker-held definition; credentials belong only to the root. */
export interface RestWorkerDefinition {
  readonly id: string;
  readonly policy: RestGrantPolicy;
  readonly parent?: string;
  readonly installed: boolean;
}
/** Fixed credential encodings supported by the trusted harness. */
export type RestCredentialScheme = "bearer" | "x-api-key";
/** Worker initialization supplied by the harness, never by HC. */
export interface RestWorkerOptions {
  readonly definitions: readonly RestWorkerDefinition[];
  readonly credentialEnv?: string;
  readonly credentialScheme?: RestCredentialScheme;
}
interface WorkerGrant {
  readonly policy: RestGrantPolicy;
  readonly evidence: string;
  readonly token?: string;
  readonly credentialScheme?: RestCredentialScheme;
}
type Message =
  | {
    readonly kind: "init";
    readonly policy: RestGrantPolicy;
    readonly evidence: string;
    readonly options?: RestWorkerOptions;
  }
  | { readonly kind: "ready"; readonly shared: SharedArrayBuffer }
  | {
    readonly kind: "authorize";
    readonly shared: SharedArrayBuffer;
    readonly id: string;
    readonly input: RestInput;
    readonly requestId?: string;
  }
  | {
    readonly kind: "revoke";
    readonly shared: SharedArrayBuffer;
    readonly id: string;
  }
  | {
    readonly kind: "state";
    readonly shared: SharedArrayBuffer;
    readonly id: string;
  }
  | {
    readonly kind: "send";
    readonly shared: SharedArrayBuffer;
    readonly request: RestOutgoing;
    readonly stub: RestEvidenceStub;
    readonly requestId?: string;
  }
  | {
    readonly kind: "record";
    readonly shared: SharedArrayBuffer;
    readonly evidence: RestEvidence;
  };
type Meta =
  | {
    readonly ok: true;
    readonly status: number;
    readonly headers: Readonly<Record<string, string>>;
  }
  | {
    readonly ok: true;
    readonly recorded: true;
    readonly available?: boolean;
    readonly sent?: number;
  }
  | { readonly ok: false; readonly reason: string };
interface HostWorker {
  postMessage(message: unknown): void;
  terminate(): void;
}
const Worker = (globalThis as unknown as {
  Worker: new (url: string, options: {
    type: "module";
    name: string;
    deno?: {
      permissions: {
        env: string[];
        net: string[];
        read: boolean;
        write: string[];
        run: boolean;
        ffi: boolean;
      };
    };
  }) => HostWorker;
}).Worker;
type WorkerEvent<T> = { readonly data: T };

/** One root's transport; policy and mutable authorization state live in its worker. */
export class LiveTransport implements RestTransport {
  readonly #worker: HostWorker;
  private closed = false;
  public constructor(
    private readonly policy: RestGrantPolicy,
    private readonly evidence: string,
    private readonly marginMs: number = WAIT_MARGIN_MS,
    options?: RestWorkerOptions,
  ) {
    this.#worker = new Worker(import.meta.url, {
      type: "module",
      name: WORKER_NAME,
      ...(options
        ? {
          deno: {
            permissions: {
              env: options.credentialEnv ? [options.credentialEnv] : [],
              net: [new URL(policy.base).host],
              read: false,
              write: [evidence],
              run: false,
              ffi: false,
            },
          },
        }
        : {}),
    });
    const init: Message = { kind: "init", policy, evidence, options };
    this.#worker.postMessage(init);
  }
  /** Reads only the worker's boolean availability, never its credential. */
  public ready(): boolean {
    const shared = new SharedArrayBuffer(HEADER_BYTES + META_CAPACITY);
    const answer = this.call({ kind: "ready", shared }, RECORD_WAIT_MS).meta;
    if (!answer.ok || !("recorded" in answer)) {
      throw new Error("REST worker startup failed");
    }
    return answer.available === true;
  }
  public describe(): string {
    return `live ${this.policy.base}, evidence ${this.evidence}`;
  }
  public authorize(id: string, input: RestInput): RestTransportResult {
    const requestId = input.ok && isRestEffect(input.request.method ?? "GET")
      ? crypto.randomUUID()
      : undefined;
    const shared = this.buffer();
    return this.result(
      this.call(
        { kind: "authorize", shared, id, input, requestId },
        this.policy.timeoutMs + this.marginMs,
        requestId,
      ),
    );
  }
  public requestsSent(id: string): number {
    const shared = new SharedArrayBuffer(HEADER_BYTES + META_CAPACITY);
    const answer =
      this.call({ kind: "state", shared, id }, RECORD_WAIT_MS).meta;
    return answer.ok && "recorded" in answer ? answer.sent ?? 0 : 0;
  }
  public revoke(id: string): void {
    const shared = new SharedArrayBuffer(HEADER_BYTES + META_CAPACITY);
    this.call({ kind: "revoke", shared, id }, RECORD_WAIT_MS);
  }
  public send(
    request: RestOutgoing,
    stub: RestEvidenceStub,
  ): RestTransportResult {
    const requestId = isRestEffect(request.method ?? "GET")
      ? crypto.randomUUID()
      : undefined;
    return this.result(
      this.call(
        { kind: "send", shared: this.buffer(), request, stub, requestId },
        request.timeoutMs + this.marginMs,
        requestId,
      ),
    );
  }
  public record(evidence: RestEvidence): boolean {
    return this.call({
      kind: "record",
      shared: new SharedArrayBuffer(HEADER_BYTES + META_CAPACITY),
      evidence,
    }, Math.min(RECORD_WAIT_MS, this.policy.timeoutMs + this.marginMs)).meta.ok;
  }
  public close(): void {
    this.closed = true;
    this.#worker.terminate();
  }
  private buffer(): SharedArrayBuffer {
    return new SharedArrayBuffer(
      HEADER_BYTES + META_CAPACITY + this.policy.responseBytes,
    );
  }
  private result(
    answer: { readonly meta: Meta; readonly body: Uint8Array },
  ): RestTransportResult {
    if (!answer.meta.ok) return answer.meta;
    if (!("status" in answer.meta)) {
      return { ok: false, reason: "resource-transport" };
    }
    return {
      ok: true,
      status: answer.meta.status,
      headers: answer.meta.headers,
      body: new TextDecoder("utf-8", { fatal: false }).decode(answer.body),
    };
  }
  private call(
    message: Exclude<Message, { kind: "init" }>,
    waitMs: number,
    requestId?: string,
  ): { readonly meta: Meta; readonly body: Uint8Array } {
    if (this.closed) {
      return {
        meta: { ok: false, reason: "resource-transport closed" },
        body: new Uint8Array(),
      };
    }
    const state = new Int32Array(message.shared, 0, 3);
    this.#worker.postMessage(message);
    if (Atomics.wait(state, 0, PENDING, waitMs) === "timed-out") {
      this.close();
      return {
        meta: {
          ok: false,
          reason: requestId
            ? `resource-effect-uncertain ${requestId}`
            : "resource-transport timeout",
        },
        body: new Uint8Array(),
      };
    }
    try {
      const answer = readAnswer(message.shared);
      if (
        requestId && !answer.meta.ok &&
        answer.meta.reason === "resource-transport"
      ) {
        return {
          meta: { ok: false, reason: `resource-effect-uncertain ${requestId}` },
          body: new Uint8Array(),
        };
      }
      return answer;
    } catch {
      this.close();
      return {
        meta: {
          ok: false,
          reason: requestId
            ? `resource-effect-uncertain ${requestId}`
            : "resource-transport",
        },
        body: new Uint8Array(),
      };
    }
  }
}
/** Evidence contains fixed metadata only, never headers, body or raw errors. */
function appendEvidence(path: string, record: RestEvidence): boolean {
  try {
    Deno.writeTextFileSync(path, `${JSON.stringify(record)}\n`, {
      append: true,
      create: true,
    });
    return true;
  } catch {
    return false;
  }
}
/** Reads an answer the worker wrote, copying it out of the shared buffer. */
function readAnswer(
  shared: SharedArrayBuffer,
): { readonly meta: Meta; readonly body: Uint8Array } {
  const state = new Int32Array(shared, 0, 3);
  const metaLength = Atomics.load(state, 1);
  const bodyLength = Atomics.load(state, 2);
  const bytes = new Uint8Array(shared);
  const metaText = new TextDecoder().decode(
    bytes.slice(HEADER_BYTES, HEADER_BYTES + metaLength),
  );
  const start = HEADER_BYTES + META_CAPACITY;
  return {
    meta: JSON.parse(metaText) as Meta,
    body: bytes.slice(start, start + bodyLength),
  };
}
/** Writes an answer into the shared buffer and wakes the main isolate. */
function writeAnswer(
  shared: SharedArrayBuffer,
  meta: Meta,
  body: Uint8Array = new Uint8Array(),
): void {
  let encoded = encoder.encode(JSON.stringify(meta));
  let payload = body;
  // The body fits by construction: the buffer holds `responseBytes`, and
  // `receive` stops past that. Allowlisted headers could still be too long.
  if (encoded.length > META_CAPACITY) {
    encoded = encoder.encode(
      JSON.stringify({ ok: false, reason: "resource-transport" }),
    );
    payload = new Uint8Array();
  }
  const bytes = new Uint8Array(shared);
  bytes.set(encoded, HEADER_BYTES);
  bytes.set(payload, HEADER_BYTES + META_CAPACITY);
  const state = new Int32Array(shared, 0, 3);
  Atomics.store(state, 1, encoded.length);
  Atomics.store(state, 2, payload.length);
  Atomics.store(state, 0, ANSWERED);
  Atomics.notify(state, 0);
}
/** What one fetch produced, before its evidence is appended. */
type Received =
  | {
    readonly ok: true;
    readonly status: number;
    readonly headers: Readonly<Record<string, string>>;
    readonly body: Uint8Array;
    readonly bytes: number;
  }
  | {
    readonly ok: false;
    readonly reason: string;
    readonly status: number | null;
    readonly bytes: number;
  };
/** Fetches one verified request within its effective time and size budgets. */
async function receive(
  request: RestOutgoing,
  grant: WorkerGrant,
): Promise<Received> {
  const controller = new AbortController();
  let timedOut = false;
  const timer = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, request.timeoutMs);
  let status: number | null = null;
  let total = 0;
  try {
    const response = await fetch(request.url, {
      method: request.method ?? "GET",
      body: request.body,
      headers: {
        ...request.headers,
        ...(grant.token
          ? grant.credentialScheme === "x-api-key"
            ? { "x-api-key": grant.token }
            : { authorization: `Bearer ${grant.token}` }
          : {}),
      },
      redirect: "manual",
      signal: controller.signal,
    });
    status = response.status;
    const chunks: Uint8Array[] = [];
    const reader = response.body?.getReader();
    while (reader !== undefined) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.length;
      if (total > request.responseBytes) {
        controller.abort();
        return {
          ok: false,
          reason: "resource-budget response-size",
          status,
          bytes: total,
        };
      }
      chunks.push(value);
    }
    const body = new Uint8Array(total);
    let offset = 0;
    for (const chunk of chunks) {
      body.set(chunk, offset);
      offset += chunk.length;
    }
    return {
      ok: true,
      status,
      headers: responseHeaders(grant.policy, response.headers.entries()),
      body,
      bytes: total,
    };
  } catch {
    return {
      ok: false,
      reason: timedOut ? "resource-transport timeout" : "resource-transport",
      status,
      bytes: total,
    };
  } finally {
    clearTimeout(timer);
  }
}
/** Worker initialization is trusted; all later sends are independently checked. */
function installWorker(
  scope: { onmessage: ((event: WorkerEvent<Message>) => void) | null },
): void {
  let held: WorkerGrant;
  let available = true;
  let legacy = false;
  const authorities = new Map<string, RestAuthority>();
  const installed = new Set<string>();
  const record = (stub: RestEvidenceStub, reason: string): Meta => {
    const appended = appendEvidence(held.evidence, {
      ...stub,
      outcome: "refused",
      status: null,
      responseBytes: 0,
      refusal: reason,
    });
    return { ok: false, reason: appended ? reason : "resource-evidence" };
  };
  scope.onmessage = async (event: WorkerEvent<Message>) => {
    const message = event.data;
    if (message.kind === "init") {
      if (held!) return;
      let token: string | undefined;
      if (message.options?.credentialEnv) {
        try {
          token = Deno.env.get(message.options.credentialEnv);
        } catch { /* unavailable */ }
        available = token !== undefined && token !== "";
      }
      held = {
        policy: message.policy,
        evidence: message.evidence,
        token,
        credentialScheme: message.options?.credentialScheme,
      };
      legacy = message.options === undefined;
      const definitions = message.options?.definitions ??
        [{ id: held.policy.base, policy: held.policy, installed: true }];
      for (const definition of definitions) {
        const parent = definition.parent
          ? authorities.get(definition.parent)
          : undefined;
        if (definition.parent && !parent) {
          throw new Error("REST worker parent missing");
        }
        authorities.set(
          definition.id,
          new RestAuthority(definition.policy, Date.now, definition.id, parent),
        );
        if (definition.installed) installed.add(definition.id);
      }
      return;
    }
    if (message.kind === "ready") {
      writeAnswer(message.shared, { ok: true, recorded: true, available });
      return;
    }
    if (message.kind === "record") {
      writeAnswer(
        message.shared,
        appendEvidence(held.evidence, message.evidence)
          ? { ok: true, recorded: true }
          : { ok: false, reason: "resource-evidence" },
      );
      return;
    }
    if (message.kind === "revoke" || message.kind === "state") {
      const authority = authorities.get(message.id);
      if (authority && message.kind === "revoke") authority.revoked = true;
      writeAnswer(message.shared, {
        ok: true,
        recorded: true,
        sent: authority?.sent ?? 0,
      });
      return;
    }
    let authority: RestAuthority | undefined;
    let input: RestInput;
    let unbound: RestEvidenceStub = {
      grant: null,
      at: new Date().toISOString(),
      method: "GET",
      url: null,
    };
    if (message.kind === "authorize") {
      authority = installed.has(message.id)
        ? authorities.get(message.id)
        : undefined;
      input = message.input;
    } else {
      // Compatibility for direct public-transport callers; disabled for registered grants.
      unbound = message.stub;
      if (
        !legacy || !withinBase(held.policy.base, message.request.url) ||
        message.stub.url !== message.request.url
      ) {
        writeAnswer(
          message.shared,
          record(
            unbound,
            legacy ? "resource-escaped-root" : "resource-unbound",
          ),
        );
        return;
      }
      authority = authorities.get(held.policy.base);
      const url = new URL(message.request.url);
      const root = new URL(held.policy.base).pathname;
      const path = url.pathname.length < root.length
        ? ""
        : url.pathname.slice(root.length).split("/").map(decodeURIComponent)
          .join("/");
      input = {
        ok: true,
        request: {
          path,
          query: [...url.searchParams],
          headers: Object.entries(message.request.headers),
          method: message.request.method,
          body: message.request.body,
        },
      };
    }
    if (!authority || !available) {
      writeAnswer(message.shared, record(unbound, "resource-unbound"));
      return;
    }
    const prepared = authority.prepare(input);
    if (!prepared.ok) {
      writeAnswer(message.shared, record(prepared.stub, prepared.reason));
      return;
    }
    const request = prepared.request;
    const effect = isRestEffect(request.method ?? "GET");
    const requestId = message.requestId;
    if (effect && (!requestId || typeof requestId !== "string")) {
      writeAnswer(
        message.shared,
        record(prepared.stub, "resource-request-shape"),
      );
      return;
    }
    const ancestry: string[] = [];
    for (let parent = authority.parent; parent; parent = parent.parent) {
      ancestry.push(parent.id);
    }
    const stub = {
      ...prepared.stub,
      ...(ancestry.length ? { ancestry } : {}),
      ...(effect
        ? { requestId, requestBytes: encoder.encode(request.body ?? "").length }
        : {}),
    };
    if (
      effect &&
      !appendEvidence(held.evidence, {
        ...stub,
        phase: "intent",
        outcome: "sent",
        status: null,
        responseBytes: 0,
        refusal: null,
      })
    ) {
      writeAnswer(message.shared, { ok: false, reason: "resource-evidence" });
      return;
    }
    const received = await receive(request, {
      ...held,
      policy: authority.policy,
    });
    const appended = appendEvidence(held.evidence, {
      ...stub,
      ...(effect ? { phase: "completion" as const } : {}),
      outcome: "sent",
      status: received.status,
      responseBytes: received.bytes,
      refusal: received.ok ? null : received.reason,
    });
    if (effect && (!received.ok || !appended)) {
      writeAnswer(message.shared, {
        ok: false,
        reason: `resource-effect-uncertain ${requestId}`,
      });
    } else if (!appended) {
      writeAnswer(message.shared, { ok: false, reason: "resource-evidence" });
    } else if (!received.ok) {
      writeAnswer(message.shared, { ok: false, reason: received.reason });
    } else {writeAnswer(message.shared, {
        ok: true,
        status: received.status,
        headers: received.headers,
      }, received.body);}
  };
}
if ((globalThis as { name?: string }).name === WORKER_NAME) {
  installWorker(
    globalThis as unknown as {
      onmessage: ((event: WorkerEvent<Message>) => void) | null;
    },
  );
}
