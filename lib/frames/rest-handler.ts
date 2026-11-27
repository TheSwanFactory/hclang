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
 * one. `spec/a20-rest-resource/` records the design.
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
import {
  attenuateRestPolicy,
  RestAuthority,
  type RestNarrowing,
} from "./rest-authority.ts";
import type { ReferenceParts } from "./resource-reference.ts";
import {
  namesGrant,
  responseHeaders,
  REST_METHOD,
  type RestEvidenceStub,
  type RestGrantPolicy,
  restGrantPolicy,
  type RestGrantSpec,
  type RestInput,
  type RestRefusal,
  type RestRequest,
  type RestTransport,
  type RestTransportResult,
} from "./rest-policy.ts";
/** The keys a request record may hold. */
const REQUEST_KEYS = new Set(["path", "query", "headers", "method", "body"]);
export type { RestRequest } from "./rest-policy.ts";
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
 * Every key is optional: path, query, headers, method and body. Unknown keys,
 * values of the wrong type, and aggregates holding elements are shape refusals.
 * Method and body permissions are decided by the grant after parsing.
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
  const method = keys.includes("method")
    ? stringValue(record.getOwn("method"))
    : undefined;
  const body = keys.includes("body")
    ? stringValue(record.getOwn("body"))
    : undefined;
  if (
    (keys.includes("method") && method === undefined) ||
    (keys.includes("body") && body === undefined)
  ) return shape;
  return { ok: true, request: { path, query, headers, method, body } };
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
  public readonly authority: RestAuthority;
  public readonly id: string;
  public constructor(
    spec: RestGrantSpec,
    private readonly transport: RestTransport,
    now: () => number = Date.now,
    id: string = spec.base,
    parent?: RestGrant,
  ) {
    this.id = id;
    this.authority = new RestAuthority(
      restGrantPolicy(spec),
      now,
      id,
      parent?.authority,
    );
  }
  public get policy(): RestGrantPolicy {
    return this.authority.policy;
  }
  public get base(): string {
    return this.policy.base;
  }
  public requestsSent(): number {
    return this.transport.requestsSent?.(this.id) ?? this.authority.sent;
  }
  public revoke(): void {
    this.authority.revoked = true;
    this.transport.revoke?.(this.id);
  }
  /** Constructs a child sharing this grant's counters, clock and transport. */
  public attenuate(narrow: RestNarrowing, id?: string): RestGrant {
    const policy = attenuateRestPolicy(this.policy, narrow);
    const child = new RestGrant(
      policy,
      this.transport,
      this.authority.now,
      id ?? policy.base,
      this,
    );
    return child;
  }
  public describe(): string {
    return `${this.base} via ${this.transport.describe()}`;
  }
  public exchange(input: RestInput): RestOutcome {
    const sent = this.transport.authorize
      ? this.transport.authorize(this.id, input)
      : this.localExchange(input);
    if (!sent.ok) return sent;
    return {
      ok: true,
      response: {
        ...sent,
        headers: responseHeaders(this.policy, Object.entries(sent.headers)),
      },
    };
  }
  private localExchange(input: RestInput): RestTransportResult {
    const prepared = this.authority.prepare(input);
    if (!prepared.ok) return this.refuse(prepared.stub, prepared.reason);
    return this.transport.send(prepared.request, prepared.stub);
  }
  public refuseUnbound(): RestRefusal {
    return this.refuse({
      grant: null,
      at: new Date().toISOString(),
      method: REST_METHOD,
      url: null,
    }, "resource-unbound");
  }
  private refuse(stub: RestEvidenceStub, reason: string): RestRefusal {
    return this.transport.record({
        ...stub,
        outcome: "refused",
        status: null,
        responseBytes: 0,
        refusal: reason,
      })
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
  /** Application is one policy-checked request, answered as a response record. */
  public exchange(reference: ReferenceParts, request: Frame): HandlerExchange {
    const grant = this.grantFor(reference);
    if (!grant.ok) return grant;
    const answered = grant.grant.exchange(readRequest(request));
    return answered.ok
      ? { ok: true, response: responseRecord(answered.response) }
      : answered;
  }
  /** Store-style writing is not a REST verb; request-record application sends. */
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
