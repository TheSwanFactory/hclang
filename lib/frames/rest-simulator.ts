/**
 * A REST transport with no network behind it.
 *
 * `RestSimulator` answers from a fixture table keyed by the path below its
 * grant's base, and answers 404 for anything else. It shares everything with
 * the live transport except the sending: the policy in `rest-policy.ts`, the
 * re-verification against its own copy of the base, the response-size and
 * timeout budgets, and the evidence schema. The same HC program, byte for byte,
 * runs against both.
 *
 * It also records every call it receives, so a test can check that each one
 * was a `GET` under the base of the grant it went through.
 *
 * @module
 */
import {
  isRestEffect,
  REST_METHOD,
  type RestEvidence,
  type RestEvidenceSink,
  type RestEvidenceStub,
  type RestOutgoing,
  type RestTransport,
  type RestTransportResult,
  withinBase,
} from "./rest-policy.ts";
/** One canned response. */
export interface RestFixture {
  readonly status: number;
  readonly headers?: Readonly<Record<string, string>>;
  readonly body?: string;
  /** How long the response takes; past the timeout it never arrives. */
  readonly delayMs?: number;
}
/** What a simulator answers for a path it has no fixture for. */
export const NOT_FOUND: RestFixture = Object.freeze({
  status: 404,
  headers: { "content-type": "application/json; charset=utf-8" },
  body: '{"message":"Not Found","status":"404"}',
});
/** Evidence kept in memory, which a test reads and can make fail. */
export class MemoryEvidence implements RestEvidenceSink {
  public readonly records: RestEvidence[] = [];
  /** While true, every append fails, to check that a grant fails closed. */
  public failing = false;
  public append(record: RestEvidence): boolean {
    if (this.failing) return false;
    this.records.push(record);
    return true;
  }
}
/** One call a simulator received, as it was sent. */
export interface RestCall {
  readonly method: string;
  readonly url: string;
  readonly headers: Readonly<Record<string, string>>;
  readonly body?: string;
}
const encoder = new TextEncoder();
/** Answers a grant's requests from fixtures. */
export class RestSimulator implements RestTransport {
  /** Every call this simulator received, in order. */
  public readonly calls: RestCall[] = [];
  private readonly fixtures: ReadonlyMap<string, RestFixture>;
  /**
   * @param base The grant's base, this transport's own copy.
   * @param fixtures Responses by path below the base, `""` for the base.
   * @param evidence Where evidence goes; in memory by default.
   */
  public constructor(
    private readonly base: string,
    fixtures: Readonly<Record<string, RestFixture>>,
    public readonly evidence: RestEvidenceSink = new MemoryEvidence(),
  ) {
    this.fixtures = new Map(Object.entries(fixtures));
  }
  public describe(): string {
    return `simulator ${this.fixtures.size} fixture(s)`;
  }
  public send(
    request: RestOutgoing,
    stub: RestEvidenceStub,
  ): RestTransportResult {
    if (!withinBase(this.base, request.url)) {
      return this.refused(stub, "resource-escaped-root");
    }
    const method = request.method ?? REST_METHOD;
    const effect = isRestEffect(method);
    const located = effect
      ? {
        ...stub,
        requestId: crypto.randomUUID(),
        requestBytes: encoder.encode(request.body ?? "").length,
      }
      : stub;
    if (
      effect &&
      !this.evidence.append({
        ...located,
        phase: "intent",
        outcome: "sent",
        status: null,
        responseBytes: 0,
        refusal: null,
      })
    ) return { ok: false, reason: "resource-evidence" };
    stub = located;
    this.calls.push({
      method,
      url: request.url,
      headers: request.headers,
      ...(request.body === undefined ? {} : { body: request.body }),
    });
    const fixture = this.fixtures.get(this.pathOf(request.url)) ?? NOT_FOUND;
    if ((fixture.delayMs ?? 0) > request.timeoutMs) {
      return this.sent(stub, null, 0, "resource-transport timeout");
    }
    const body = fixture.body ?? "";
    const bytes = encoder.encode(body).length;
    if (bytes > request.responseBytes) {
      return this.sent(
        stub,
        fixture.status,
        bytes,
        "resource-budget response-size",
      );
    }
    const recorded = this.sent(stub, fixture.status, bytes, null);
    if (!recorded.ok) return recorded;
    return {
      ok: true,
      status: fixture.status,
      headers: fixture.headers ?? {},
      body,
    };
  }
  public record(evidence: RestEvidence): boolean {
    return this.evidence.append(evidence);
  }
  /** The decoded path below the base that a fixture is keyed by. */
  private pathOf(url: string): string {
    const root = new URL(this.base).pathname;
    const pathname = new URL(url).pathname;
    const below = pathname.length < root.length
      ? ""
      : pathname.slice(root.length);
    return below.split("/").map(decodeURIComponent).join("/");
  }
  /** Appends a sent request's evidence; a refusal when there is one. */
  private sent(
    stub: RestEvidenceStub,
    status: number | null,
    responseBytes: number,
    refusal: string | null,
  ): RestTransportResult {
    const effect = isRestEffect(stub.method);
    const appended = this.evidence.append({
      ...stub,
      ...(effect ? { phase: "completion" as const } : {}),
      outcome: "sent",
      status,
      responseBytes,
      refusal,
    });
    if (effect && (!appended || refusal !== null)) {
      return {
        ok: false,
        reason: `resource-effect-uncertain ${stub.requestId}`,
      };
    }
    if (!appended) return { ok: false, reason: "resource-evidence" };
    return refusal === null
      ? { ok: true, status: 0, headers: {}, body: "" }
      : { ok: false, reason: refusal };
  }
  /** Appends a refusal this transport decided before sending. */
  private refused(stub: RestEvidenceStub, reason: string): RestTransportResult {
    const appended = this.evidence.append({
      ...stub,
      outcome: "refused",
      status: null,
      responseBytes: 0,
      refusal: reason,
    });
    return { ok: false, reason: appended ? reason : "resource-evidence" };
  }
}
