/**
 * The live REST transport: a worker that fetches, behind a synchronous wait.
 *
 * HC evaluation is synchronous throughout, and so is `SchemeHandler`, so the
 * main isolate cannot await a `fetch`. It posts each request to a worker and
 * blocks with `Atomics.wait` on a `SharedArrayBuffer` until the worker writes
 * the answer there and notifies. Evaluation stays synchronous.
 *
 * This file is both halves. Imported normally it exports `LiveTransport`, the
 * main isolate's side; loaded as a worker named `WORKER_NAME` it installs the
 * worker's message handler instead. Keeping both in one module is what lets the
 * static no-network-path test (`cli/no-network-path.test.ts`) name exactly one
 * file under `cli/` that may mention `fetch(` or `new Worker`.
 *
 * The worker holds its own copy of the grant, sent once at construction, and
 * re-verifies every URL and header against it before fetching, so a defect in
 * the main isolate cannot widen what is sent. It never follows a redirect
 * (`redirect: "manual"`), counts response bytes while streaming and stops past
 * the grant's budget, aborts past the timeout, and appends the evidence record
 * synchronously before it releases the response. A failed append answers
 * `resource-evidence` and discards the response.
 *
 * @module
 */
import {
  requestHeaders,
  responseHeaders,
  type RestEvidence,
  type RestEvidenceStub,
  type RestGrantPolicy,
  type RestOutgoing,
  type RestTransport,
  type RestTransportResult,
  withinBase,
} from "../lib/frames/rest-policy.ts";
/** The name a worker is started under, which selects the worker half. */
const WORKER_NAME = "hc-rest-transport";
/** Bytes for the three state words at the head of the shared buffer. */
const HEADER_BYTES = 12;
/** Bytes for the JSON part of an answer: status, headers or refusal. */
const META_CAPACITY = 64 * 1024;
/** How long past its own timeout the main isolate waits for the worker. */
const WAIT_MARGIN_MS = 10_000;
/** How long the main isolate waits for an evidence append. */
const RECORD_WAIT_MS = 10_000;
/** The state word while the worker has not answered, then once it has. */
const PENDING = 0;
const ANSWERED = 1;
/** One grant's copy, as the worker holds it. */
interface WorkerGrant {
  readonly policy: RestGrantPolicy;
  readonly evidence: string;
}
/** A message from the main isolate to the worker. */
type Message =
  | { readonly kind: "init"; readonly grant: WorkerGrant }
  | {
    readonly kind: "send";
    readonly shared: SharedArrayBuffer;
    readonly request: RestOutgoing;
    readonly stub: RestEvidenceStub;
  }
  | {
    readonly kind: "record";
    readonly shared: SharedArrayBuffer;
    readonly evidence: RestEvidence;
  };
/** The JSON half of an answer; the body travels as raw bytes beside it. */
type Meta =
  | {
    readonly ok: true;
    readonly status: number;
    readonly headers: Readonly<Record<string, string>>;
  }
  | { readonly ok: true; readonly recorded: true }
  | { readonly ok: false; readonly reason: string };
const encoder = new TextEncoder();
/** The part of a web worker this module uses. */
interface HostWorker {
  postMessage(message: unknown): void;
  terminate(): void;
}
/**
 * The host's `Worker`, typed locally.
 *
 * The npm build type-checks this module against Node's types, which have no
 * global `Worker`, so the constructor is read from `globalThis` instead of
 * named as a global type. Live REST runs only under Deno.
 */
const Worker = (globalThis as unknown as {
  Worker: new (
    url: string,
    options: { type: "module"; name: string },
  ) => HostWorker;
}).Worker;
/** The event a worker receives. */
type WorkerEvent<T> = { readonly data: T };
/**
 * The main isolate's side: a `RestTransport` whose sends run in a worker.
 *
 * One worker per grant, started at construction. `close` terminates it; a CLI
 * run exits the process instead.
 */
export class LiveTransport implements RestTransport {
  readonly #worker: HostWorker;
  /**
   * @param policy The grant, copied to the worker once and never again.
   * @param evidence The absolute path the worker appends evidence to.
   * @param marginMs How long past a request's timeout to wait for the worker
   *   before answering `resource-transport timeout` without it.
   */
  public constructor(
    private readonly policy: RestGrantPolicy,
    private readonly evidence: string,
    private readonly marginMs: number = WAIT_MARGIN_MS,
  ) {
    this.#worker = new Worker(import.meta.url, {
      type: "module",
      name: WORKER_NAME,
    });
    const init: Message = { kind: "init", grant: { policy, evidence } };
    this.#worker.postMessage(init);
  }
  public describe(): string {
    return `live ${this.policy.base}, evidence ${this.evidence}`;
  }
  public send(
    request: RestOutgoing,
    stub: RestEvidenceStub,
  ): RestTransportResult {
    const shared = new SharedArrayBuffer(
      HEADER_BYTES + META_CAPACITY + request.responseBytes,
    );
    const answer = this.call(
      { kind: "send", shared, request, stub },
      request.timeoutMs + this.marginMs,
    );
    const meta = answer.meta;
    if (!meta.ok) return meta;
    if (!("status" in meta)) {
      return { ok: false, reason: "resource-transport" };
    }
    return {
      ok: true,
      status: meta.status,
      headers: meta.headers,
      body: new TextDecoder("utf-8", { fatal: false }).decode(answer.body),
    };
  }
  public record(evidence: RestEvidence): boolean {
    const shared = new SharedArrayBuffer(HEADER_BYTES + META_CAPACITY);
    return this.call(
      { kind: "record", shared, evidence },
      Math.min(RECORD_WAIT_MS, this.policy.timeoutMs + this.marginMs),
    ).meta.ok;
  }
  /** Stops the worker. */
  public close(): void {
    this.#worker.terminate();
  }
  /** Posts one message and blocks until the worker answers or time runs out. */
  private call(
    message: Extract<Message, { shared: SharedArrayBuffer }>,
    waitMs: number,
  ): { readonly meta: Meta; readonly body: Uint8Array } {
    const state = new Int32Array(message.shared, 0, 3);
    this.#worker.postMessage(message);
    if (Atomics.wait(state, 0, PENDING, waitMs) === "timed-out") {
      return {
        meta: { ok: false, reason: "resource-transport timeout" },
        body: new Uint8Array(),
      };
    }
    return readAnswer(message.shared);
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
/** Appends one evidence line synchronously; false when the host refuses. */
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
/** Fetches one verified `GET`, within the grant's time and size budgets. */
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
      method: "GET",
      headers: request.headers,
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
/** The worker half: re-verifies, fetches, records, answers. */
function installWorker(scope: {
  onmessage: ((event: WorkerEvent<Message>) => void) | null;
}): void {
  // Messages arrive in the order they were posted, and the constructor posts
  // `init` first, so every later message finds the grant. Were one ever to
  // arrive first, reading the grant would throw in the worker: nothing is
  // answered, the main isolate's wait times out, and Deno then ends the whole
  // process with "Unhandled error in child worker". That still fails closed,
  // but for the run rather than for one request.
  let grant: WorkerGrant | undefined;
  scope.onmessage = async (event: WorkerEvent<Message>) => {
    const message = event.data;
    if (message.kind === "init") {
      grant ??= message.grant;
      return;
    }
    const held = grant as WorkerGrant;
    if (message.kind === "record") {
      const ok = appendEvidence(held.evidence, message.evidence);
      writeAnswer(
        message.shared,
        ok ? { ok: true, recorded: true } : {
          ok: false,
          reason: "resource-evidence",
        },
      );
      return;
    }
    const { request, stub } = message;
    const headers = requestHeaders(
      held.policy,
      Object.entries(request.headers),
    );
    const escaped = !withinBase(held.policy.base, request.url) ||
      stub.url !== request.url;
    if (escaped || !headers.ok) {
      const refusal = escaped
        ? "resource-escaped-root"
        : "resource-header-forbidden";
      const ok = appendEvidence(held.evidence, {
        ...stub,
        outcome: "refused",
        status: null,
        responseBytes: 0,
        refusal,
      });
      writeAnswer(message.shared, {
        ok: false,
        reason: ok ? refusal : "resource-evidence",
      });
      return;
    }
    const received = await receive({
      url: request.url,
      headers: headers.headers,
      timeoutMs: held.policy.timeoutMs,
      responseBytes: held.policy.responseBytes,
    }, held);
    const appended = appendEvidence(held.evidence, {
      ...stub,
      outcome: "sent",
      status: received.status,
      responseBytes: received.bytes,
      refusal: received.ok ? null : received.reason,
    });
    if (!appended) {
      writeAnswer(message.shared, { ok: false, reason: "resource-evidence" });
    } else if (!received.ok) {
      writeAnswer(message.shared, { ok: false, reason: received.reason });
    } else {
      writeAnswer(
        message.shared,
        { ok: true, status: received.status, headers: received.headers },
        received.body,
      );
    }
  };
}
if ((globalThis as { name?: string }).name === WORKER_NAME) {
  installWorker(
    globalThis as unknown as {
      onmessage: ((event: WorkerEvent<Message>) => void) | null;
    },
  );
}
