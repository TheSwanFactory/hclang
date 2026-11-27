/**
 * The REST resource's policy, as pure functions over plain data.
 *
 * This module validates policies, URLs and headers without touching a Frame or
 * a host. rest-authority.ts combines these decisions with shared grant state.
 * Live enforcement runs in the transport worker, independently of main-side
 * diagnostics, so an evaluator-side defect cannot widen the outgoing request.
 *
 * Methods and UTF-8 bodies are bounded by the grant. Programs cannot supply
 * credentials: authorization, cookie, host and proxy headers are always refused.
 * The accepted design is in spec/a20-rest-resource/08-Codex-accepted-design-and-implementation.md.
 *
 * @module
 */
import { normalizeReference } from "./resource-reference.ts";
/** A refusal, naming its reason in the `$!.…` vocabulary without the sigil. */
export type RestRefusal = { readonly ok: false; readonly reason: string };
/** The default request method. */
export const REST_METHOD = "GET";
/** Request headers a program may set on any grant. */
export const DEFAULT_REQUEST_HEADERS: readonly string[] = Object.freeze([
  "accept",
  "accept-language",
  "if-none-match",
  "if-modified-since",
  "content-type",
  "if-match",
]);
/** Response headers a program may see from any grant. */
export const DEFAULT_RESPONSE_HEADERS: readonly string[] = Object.freeze([
  "content-type",
  "content-length",
  "etag",
  "last-modified",
  "link",
  "location",
  "retry-after",
]);
/**
 * Whether no grant may let a program set this request header.
 *
 * These are the headers that carry or replace a credential, or redirect the
 * request to another host, so allowing one would let a program bring authority
 * the grant does not hold.
 */
export const isForbiddenRequestHeader = (name: string): boolean => {
  const folded = name.toLowerCase();
  return folded === "authorization" || folded === "cookie" ||
    folded === "host" || folded.startsWith("proxy-");
};
/** What a harness writes to construct a grant, before it is checked. */
export interface RestGrantSpec {
  /** The base URI a literal must equal, trailing slash included. */
  readonly base: string;
  /** Allowed HTTP methods; public GET only when omitted. */
  readonly methods?: readonly string[];
  /** Maximum UTF-8 body size; no body bytes when omitted. */
  readonly requestBytes?: number;
  /** How many requests the grant may send in its lifetime. */
  readonly requests: number;
  /** How many response body bytes one request may receive. */
  readonly responseBytes: number;
  /** How long one request may take, in milliseconds. */
  readonly timeoutMs: number;
  /** How long the grant lasts from construction, in milliseconds. */
  readonly lifetimeMs: number;
  /** Request headers this grant adds to the default allowlist. */
  readonly requestHeaders?: readonly string[];
  /** Response headers this grant adds to the default allowlist. */
  readonly responseHeaders?: readonly string[];
}
/** A checked grant: a canonical base, its budgets and its allowlists. */
export interface RestGrantPolicy {
  readonly base: string;
  readonly methods: readonly string[];
  readonly requestBytes: number;
  readonly requests: number;
  readonly responseBytes: number;
  readonly timeoutMs: number;
  readonly lifetimeMs: number;
  readonly requestHeaders: readonly string[];
  readonly responseHeaders: readonly string[];
}
/** Hosts a grant may name over plain `http`, because they never leave the machine. */
const LOOPBACK_HOSTS = new Set(["127.0.0.1", "localhost", "[::1]"]);
/** A budget is a whole, non-negative count. */
const isBudget = (value: unknown): value is number =>
  typeof value === "number" && Number.isSafeInteger(value) && value >= 0;
/** A header name is an RFC 9110 token. */
const HEADER_NAME = /^[!#$%&'*+.^_`|~0-9A-Za-z-]+$/;
/**
 * Checks a grant and returns its canonical policy, or throws.
 *
 * A grant that fails is a harness defect rather than a program's refusal, so
 * this throws, as `ResourceMapStore` does for a bad key. The base must already
 * be canonical (`new URL(base).href === base`), so the string a literal is
 * compared with is the one the harness wrote.
 *
 * @param spec The grant as the harness wrote it.
 * @returns The frozen policy both transports enforce.
 */
export function restGrantPolicy(spec: RestGrantSpec): RestGrantPolicy {
  const base = spec.base;
  let url: URL;
  try {
    url = new URL(base);
  } catch {
    throw new TypeError(`REST grant base is not a URL: ${base}`);
  }
  if (url.href !== base) {
    throw new TypeError(
      `REST grant base must be canonical: ${base} (canonical: ${url.href})`,
    );
  }
  const loopback = url.protocol === "http:" &&
    LOOPBACK_HOSTS.has(url.hostname);
  if (url.protocol !== "https:" && !loopback) {
    throw new TypeError(
      `REST grant base must be https, or http on loopback: ${base}`,
    );
  }
  if (url.username !== "" || url.password !== "") {
    throw new TypeError(`REST grant base must not hold userinfo: ${base}`);
  }
  if (url.search !== "" || url.hash !== "") {
    throw new TypeError(`REST grant base must not hold a query: ${base}`);
  }
  if (!url.pathname.endsWith("/")) {
    throw new TypeError(`REST grant base must end with a slash: ${base}`);
  }
  for (const key of ["requests", "responseBytes"] as const) {
    if (!isBudget(spec[key])) {
      throw new TypeError(`REST grant ${key} must be a whole count: ${base}`);
    }
  }
  for (const key of ["timeoutMs", "lifetimeMs"] as const) {
    if (!isBudget(spec[key]) || spec[key] === 0) {
      throw new TypeError(`REST grant ${key} must be positive: ${base}`);
    }
  }
  const methods = spec.methods ?? [REST_METHOD];
  if (
    !Array.isArray(methods) ||
    methods.some((method) =>
      !["GET", "HEAD", "POST", "PUT", "PATCH", "DELETE"].includes(method)
    )
  ) throw new TypeError(`REST grant methods are invalid: ${base}`);
  if (!isBudget(spec.requestBytes ?? 0)) {
    throw new TypeError(
      `REST grant requestBytes must be a whole count: ${base}`,
    );
  }
  return Object.freeze({
    base,
    methods: Object.freeze([...new Set(methods)]),
    requestBytes: spec.requestBytes ?? 0,
    requests: spec.requests,
    responseBytes: spec.responseBytes,
    timeoutMs: spec.timeoutMs,
    lifetimeMs: spec.lifetimeMs,
    requestHeaders: allowlist(
      DEFAULT_REQUEST_HEADERS,
      spec.requestHeaders,
      base,
      true,
    ),
    responseHeaders: allowlist(
      DEFAULT_RESPONSE_HEADERS,
      spec.responseHeaders,
      base,
      false,
    ),
  });
}
/** The default allowlist plus a grant's additions, case-folded and checked. */
function allowlist(
  defaults: readonly string[],
  added: readonly string[] | undefined,
  base: string,
  request: boolean,
): readonly string[] {
  const names = new Set(defaults);
  for (const name of added ?? []) {
    if (typeof name !== "string" || !HEADER_NAME.test(name)) {
      throw new TypeError(`REST grant header is not a header name: ${base}`);
    }
    if (request && isForbiddenRequestHeader(name)) {
      throw new TypeError(
        `REST grant may not allow the ${name.toLowerCase()} header: ${base}`,
      );
    }
    names.add(name.toLowerCase());
  }
  return Object.freeze([...names].sort());
}
/**
 * Whether a written resource literal names this grant.
 *
 * Identity is the URI, spelled exactly: the literal as the program wrote it
 * must equal the canonical base, trailing slash included. A spelling that only
 * normalizes to the base (`'https://API.github.com:443/…/'`, `'…/x/../'`) is
 * not the grant, so a grep for the base finds every use of it and the program
 * stays the manifest. A sub-path of a grant is not the grant either.
 *
 * @param base A canonical grant base.
 * @param literal The literal as the program wrote it, without its quotes.
 */
export function namesGrant(base: string, literal: string): boolean {
  return literal === base;
}
/**
 * Whether a request URL is still the grant's base or below it.
 *
 * This is the re-verification both transports run before any byte moves: the
 * same origin, no userinfo, no fragment, a pathname that starts with the base's
 * pathname (or is the base without its trailing slash), and no encoded
 * separator a server might decode back into a path step.
 *
 * @param base A canonical grant base.
 * @param candidate The URL about to be sent.
 */
export function withinBase(base: string, candidate: string): boolean {
  let root: URL;
  let url: URL;
  try {
    root = new URL(base);
    url = new URL(candidate);
  } catch {
    return false;
  }
  if (url.href !== candidate) return false;
  if (url.origin !== root.origin) return false;
  if (url.username !== "" || url.password !== "" || url.hash !== "") {
    return false;
  }
  if (/%(2f|5c|2e)/i.test(url.pathname) || url.pathname.includes("\\")) {
    return false;
  }
  return url.pathname === root.pathname.slice(0, -1) ||
    url.pathname.startsWith(root.pathname);
}
/**
 * Builds the URL one request sends, then re-verifies it.
 *
 * The path is normalized by the root plane's own rule, so every refusal it
 * makes (`resource-parent-escape`, `resource-encoded-separator`, …) applies
 * unchanged, and a path that names a scheme, an authority, a query or a
 * fragment is refused. Each decoded segment is then re-encoded on its own, so a
 * decoded `?` or `#` stays a path character. The query is encoded by
 * `URLSearchParams`; there is no raw query string.
 *
 * @param base A canonical grant base.
 * @param path The relative path the program asked for, or undefined.
 * @param query The query pairs, in the order the program wrote them.
 */
export function requestUrl(
  base: string,
  path: string | undefined,
  query: readonly (readonly [string, string])[],
): { readonly ok: true; readonly url: string } | RestRefusal {
  const normal = normalizeReference(path ?? "");
  if (!normal.ok) return normal;
  const encoded = normal.path === ""
    ? ""
    : normal.path.split("/").map(encodeURIComponent).join("/");
  // Normalization drops a trailing slash, but some servers tell `/x/` from
  // `/x`, so a path that resolves to one keeps it: a final `/`, or a final `.`
  // segment, which RFC 3986 §5.2.4 resolves to a trailing slash. Only an
  // absent or empty path requests the base without its slash.
  const written = path ?? "";
  const slash = written.endsWith("/") || written === "." ||
      written.endsWith("/.")
    ? "/"
    : "";
  const target = encoded === "" && slash === ""
    ? base.slice(0, -1)
    : base + (encoded === "" ? "" : encoded + slash);
  let url: URL;
  try {
    url = new URL(target);
  } catch {
    return { ok: false, reason: "resource-escaped-root" };
  }
  if (query.length > 0) {
    url.search = new URLSearchParams(
      query.map(([key, value]): [string, string] => [key, value]),
    ).toString();
  }
  return withinBase(base, url.href)
    ? { ok: true, url: url.href }
    : { ok: false, reason: "resource-escaped-root" };
}
/**
 * Checks the headers a program asked to send, case-folding their names.
 *
 * A name outside the grant's allowlist, any forbidden name, a name written
 * twice (so the answer never depends on key order), and a value `fetch` could
 * not send (a control character, which could split one header into two, or a
 * character above U+00FF, which is not a ByteString) all answer
 * `resource-header-forbidden`. Refusing here keeps the simulated and live
 * transports in agreement and spends no request on one that cannot be sent.
 *
 * @param policy The grant whose allowlist applies.
 * @param headers The header pairs the program wrote.
 */
export function requestHeaders(
  policy: Pick<RestGrantPolicy, "requestHeaders">,
  headers: readonly (readonly [string, string])[],
):
  | { readonly ok: true; readonly headers: Readonly<Record<string, string>> }
  | RestRefusal {
  const checked: Record<string, string> = {};
  for (const [name, value] of headers) {
    const folded = name.toLowerCase();
    if (
      isForbiddenRequestHeader(folded) ||
      !policy.requestHeaders.includes(folded) ||
      Object.hasOwn(checked, folded) ||
      // deno-lint-ignore no-control-regex
      /[\u0000-\u001f\u007f]|[^\u0000-\u00ff]/.test(value)
    ) {
      return { ok: false, reason: "resource-header-forbidden" };
    }
    checked[folded] = value;
  }
  return { ok: true, headers: checked };
}
/**
 * The response headers a program may see, case-folded, the rest dropped.
 *
 * @param policy The grant whose allowlist applies.
 * @param headers The headers the transport received.
 */
export function responseHeaders(
  policy: Pick<RestGrantPolicy, "responseHeaders">,
  headers: Iterable<readonly [string, string]>,
): Record<string, string> {
  const kept: Record<string, string> = {};
  for (const [name, value] of headers) {
    const folded = name.toLowerCase();
    if (policy.responseHeaders.includes(folded)) kept[folded] = value;
  }
  return kept;
}
/** Parsed request data, containing no authority or transport limits. */
export interface RestRequest {
  readonly path?: string;
  readonly query: readonly (readonly [string, string])[];
  readonly headers: readonly (readonly [string, string])[];
  readonly method?: string;
  readonly body?: string;
}
/** Request parsing result. */
export type RestInput =
  | { readonly ok: true; readonly request: RestRequest }
  | RestRefusal;
/** Whether a method needs an intent and completion record. */
export const isRestEffect = (method: string): boolean =>
  method !== "GET" && method !== "HEAD";

/** A verified request as a transport receives it. */
export interface RestOutgoing {
  readonly method?: string;
  readonly body?: string;
  /** The URL, already built and re-verified by `requestUrl`. */
  readonly url: string;
  /** The checked request headers, names case-folded. */
  readonly headers: Readonly<Record<string, string>>;
  /** The grant's per-request timeout. */
  readonly timeoutMs: number;
  /** The grant's per-request response body budget. */
  readonly responseBytes: number;
}
/** What a transport answers for one request. */
export type RestTransportResult =
  | {
    readonly ok: true;
    readonly status: number;
    readonly headers: Readonly<Record<string, string>>;
    readonly body: string;
  }
  | RestRefusal;
/**
 * One evidence record, written for every application, sent or refused.
 *
 * Records contain no request header values or bodies. Effect records carry a
 * request ID joining intent and completion; credentials stay in the worker.
 */
export interface RestEvidence {
  /** Present on effect records, counted before dispatch. */
  readonly requestBytes?: number;
  readonly requestId?: string;
  readonly phase?: "intent" | "completion";
  readonly ancestry?: readonly string[];
  /** The grant the application went through, or null for no grant. */
  readonly grant: string | null;
  /** When the application was decided, as an ISO 8601 instant. */
  readonly at: string;
  /** The verified HTTP method. */
  readonly method: string;
  /** The URL sent, or null when the refusal came before one existed. */
  readonly url: string | null;
  /** `sent` once the transport was called, `refused` before. */
  readonly outcome: "sent" | "refused";
  /** The response status, or null when none arrived. */
  readonly status: number | null;
  /** Response body bytes received. */
  readonly responseBytes: number;
  /** The refusal reason, or null when the response was released. */
  readonly refusal: string | null;
}
/** The evidence fields known before a transport is called. */
export type RestEvidenceStub = Pick<
  RestEvidence,
  "grant" | "at" | "method" | "url" | "requestId" | "requestBytes" | "ancestry"
>;
/** Where a transport appends evidence; an append that fails answers false. */
export interface RestEvidenceSink {
  append(record: RestEvidence): boolean;
}
/**
 * One way to send a verified request.
 *
 * A transport is reachable only from `RestGrant`, after the policy above has
 * passed, and it re-verifies the URL against its own copy of the grant. It
 * appends the evidence for a sent request itself, before it releases the
 * response, and answers `resource-evidence` with the response discarded when
 * the append fails.
 */
export interface RestTransport {
  /** Live transports own final policy and state in their worker. */
  authorize?(grant: string, input: RestInput): RestTransportResult;
  /** Reads the authoritative request count for a live grant. */
  requestsSent?(grant: string): number;
  /** Revocation forwarded to the enforcement owner. */
  revoke?(grant: string): void;
  /** This transport's identity, for a harness or a test, never for a program. */
  describe(): string;
  /** Sends one authorized request and records its evidence. */
  send(request: RestOutgoing, evidence: RestEvidenceStub): RestTransportResult;
  /** Records a refusal decided before sending, through the same channel. */
  record(evidence: RestEvidence): boolean;
}
