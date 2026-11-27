import { expect } from "@std/expect";
import { describe, it } from "@std/testing/bdd";
import {
  DEFAULT_REQUEST_HEADERS,
  isForbiddenRequestHeader,
  namesGrant,
  requestHeaders,
  requestUrl,
  responseHeaders,
  restGrantPolicy,
  type RestGrantSpec,
  withinBase,
} from "../frames.ts";
const BASE = "https://api.github.com/repos/TheSwanFactory/hclang/";
const spec = (overrides: Partial<RestGrantSpec> = {}): RestGrantSpec => ({
  base: BASE,
  requests: 3,
  responseBytes: 100,
  timeoutMs: 1000,
  lifetimeMs: 60_000,
  ...overrides,
});
describe("restGrantPolicy", () => {
  it("accepts a canonical https base and freezes it", () => {
    const policy = restGrantPolicy(spec());
    expect(policy.base).toEqual(BASE);
    expect(Object.isFrozen(policy)).toEqual(true);
    expect(policy.requestHeaders).toEqual([...DEFAULT_REQUEST_HEADERS].sort());
  });
  it("accepts plain http only on loopback", () => {
    expect(restGrantPolicy(spec({ base: "http://127.0.0.1:8080/api/" })).base)
      .toEqual("http://127.0.0.1:8080/api/");
    expect(() => restGrantPolicy(spec({ base: "http://example.com/" })))
      .toThrow("https");
  });
  it("refuses a base that is not canonical, scoped or slash-terminated", () => {
    for (
      const base of [
        "https://API.github.com/repos/",
        "https://api.github.com/repos",
        "https://user:pw@api.github.com/",
        "https://api.github.com/?q=1",
        "https://api.github.com/#f",
        "ftp://api.github.com/",
        "not a url",
      ]
    ) {
      expect(() => restGrantPolicy(spec({ base }))).toThrow();
    }
  });
  it("refuses budgets that are not whole counts", () => {
    expect(() => restGrantPolicy(spec({ requests: -1 }))).toThrow();
    expect(() => restGrantPolicy(spec({ responseBytes: 1.5 }))).toThrow();
    expect(() => restGrantPolicy(spec({ timeoutMs: 0 }))).toThrow();
    expect(() => restGrantPolicy(spec({ lifetimeMs: Number.NaN }))).toThrow();
  });
  it("lets no grant allow a credential-bearing or host-changing header", () => {
    for (
      const name of [
        "Authorization",
        "x-api-key",
        "cookie",
        "HOST",
        "proxy-authorization",
      ]
    ) {
      expect(isForbiddenRequestHeader(name)).toEqual(true);
      expect(() => restGrantPolicy(spec({ requestHeaders: [name] })))
        .toThrow("may not allow");
    }
    expect(
      restGrantPolicy(spec({ requestHeaders: ["X-GitHub-Api-Version"] }))
        .requestHeaders,
    ).toContain("x-github-api-version");
  });
});
describe("namesGrant", () => {
  it("is the base spelled exactly", () => {
    expect(namesGrant(BASE, BASE)).toEqual(true);
  });
  it("refuses aliases, sub-paths, parents, other origins and decorations", () => {
    for (
      const literal of [
        "HTTPS://API.GITHUB.COM/repos/TheSwanFactory/hclang/",
        "https://api.github.com:443/repos/TheSwanFactory/hclang/",
        `${BASE}x/../`,
        `${BASE}%2e%2e/hclang/`,
        `${BASE}issues/`,
        "https://api.github.com/repos/TheSwanFactory/hclang",
        "https://api.github.com/repos/TheSwanFactory/",
        "http://api.github.com/repos/TheSwanFactory/hclang/",
        "https://evil.example/repos/TheSwanFactory/hclang/",
        "https://user@api.github.com/repos/TheSwanFactory/hclang/",
        `${BASE}?q=1`,
        `${BASE}#x`,
        "not a url",
      ]
    ) {
      expect(namesGrant(BASE, literal)).toEqual(false);
    }
  });
});
describe("requestUrl", () => {
  const url = (path?: string, query: [string, string][] = []) =>
    requestUrl(BASE, path, query);
  it("builds the base without its slash for an empty path", () => {
    expect(url()).toEqual({
      ok: true,
      url: "https://api.github.com/repos/TheSwanFactory/hclang",
    });
    expect(url("")).toEqual(url());
  });
  it("appends a normalized path and an encoded query", () => {
    expect(url("issues/277", [["state", "open"], ["q", "a b&c"]])).toEqual({
      ok: true,
      url: `${BASE}issues/277?state=open&q=a+b%26c`,
    });
  });
  it("keeps a trailing slash the path was written with", () => {
    expect(url("issues/277/")).toEqual({ ok: true, url: `${BASE}issues/277/` });
    expect(url("issues/./")).toEqual({ ok: true, url: `${BASE}issues/` });
    expect(url("./")).toEqual({ ok: true, url: BASE });
    expect(url(".")).toEqual({ ok: true, url: BASE });
    expect(url("issues/.")).toEqual({ ok: true, url: `${BASE}issues/` });
    expect(url("issues.")).toEqual({ ok: true, url: `${BASE}issues.` });
    expect(url("issues/277")).toEqual({ ok: true, url: `${BASE}issues/277` });
  });
  it("keeps a decoded ? or # inside the path", () => {
    expect(url("a%3Fb%23c")).toEqual({ ok: true, url: `${BASE}a%3Fb%23c` });
  });
  it("refuses every escape the root plane refuses, unchanged", () => {
    const reasons = (path: string) => {
      const answer = url(path);
      return answer.ok ? "ok" : answer.reason;
    };
    expect(reasons("../x")).toEqual("resource-parent-escape");
    expect(reasons("a/../../x")).toEqual("resource-parent-escape");
    expect(reasons("%2e%2e/x")).toEqual("resource-encoded-separator");
    expect(reasons("a%2fb")).toEqual("resource-encoded-separator");
    expect(reasons("a%5cb")).toEqual("resource-encoded-separator");
    expect(reasons("a\\b")).toEqual("resource-alternate-separator");
    expect(reasons("a\nb")).toEqual("resource-control-character");
    expect(reasons("%zz")).toEqual("resource-invalid-encoding");
    expect(reasons("//evil.example/x")).toEqual("resource-authority-unbound");
    expect(reasons("https://evil.example/")).toEqual(
      "resource-scheme-unbound",
    );
    expect(reasons("x?y=1")).toEqual("resource-part-unsupported");
    expect(reasons("x#y")).toEqual("resource-part-unsupported");
  });
});
describe("withinBase", () => {
  it("admits the base, the base without its slash, and paths below", () => {
    expect(withinBase(BASE, BASE)).toEqual(true);
    expect(withinBase(BASE, BASE.slice(0, -1))).toEqual(true);
    expect(withinBase(BASE, `${BASE}issues/1?x=1`)).toEqual(true);
  });
  it("refuses anything a server could read as outside the base", () => {
    for (
      const candidate of [
        "https://api.github.com/repos/TheSwanFactory/hclang-other",
        "https://api.github.com/repos/TheSwanFactory/",
        "https://evil.example/repos/TheSwanFactory/hclang/",
        "https://user@api.github.com/repos/TheSwanFactory/hclang/",
        `${BASE}a%2Fb`,
        `${BASE}a%2e%2e`,
        `${BASE}x#frag`,
        `${BASE}../x`,
        "not a url",
      ]
    ) {
      expect(withinBase(BASE, candidate)).toEqual(false);
    }
  });
});
describe("headers", () => {
  const policy = restGrantPolicy(
    spec({ responseHeaders: ["x-ratelimit-remaining"] }),
  );
  it("case-folds request names and refuses names off the allowlist", () => {
    expect(requestHeaders(policy, [["Accept", "application/json"]])).toEqual({
      ok: true,
      headers: { accept: "application/json" },
    });
    for (const name of ["authorization", "Cookie", "host", "x-custom"]) {
      expect(requestHeaders(policy, [[name, "v"]])).toEqual({
        ok: false,
        reason: "resource-header-forbidden",
      });
    }
    expect(requestHeaders(policy, [["accept", "a\r\nauthorization: x"]]))
      .toEqual({ ok: false, reason: "resource-header-forbidden" });
  });
  it("refuses a value fetch cannot send, and a name written twice", () => {
    expect(requestHeaders(policy, [["accept", "é"]]).ok).toEqual(true);
    for (const value of ["€", "✓", "\u{1F600}"]) {
      expect(requestHeaders(policy, [["accept", value]])).toEqual({
        ok: false,
        reason: "resource-header-forbidden",
      });
    }
    expect(requestHeaders(policy, [["Accept", "a"], ["accept", "b"]])).toEqual(
      { ok: false, reason: "resource-header-forbidden" },
    );
  });
  it("drops response headers off the allowlist, set-cookie included", () => {
    expect(responseHeaders(policy, [
      ["Content-Type", "text/plain"],
      ["Set-Cookie", "a=1"],
      ["X-RateLimit-Remaining", "59"],
      ["server", "x"],
    ])).toEqual({
      "content-type": "text/plain",
      "x-ratelimit-remaining": "59",
    });
  });
});
