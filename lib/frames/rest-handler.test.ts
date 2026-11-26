import { expect } from "@std/expect";
import { describe, it } from "@std/testing/bdd";
import {
  Frame,
  FrameResource,
  type HandlerExchange,
  type HandlerRead,
  type HandlerWrite,
  MemoryEvidence,
  MemoryStore,
  RESOURCE_ROOT_KEY,
  ResourceHandlers,
  type RestEvidence,
  type RestFixture,
  RestGrant,
  type RestGrantSpec,
  RestHandler,
  RestSimulator,
  type RestTransport,
  type SchemeHandler,
} from "../frames.ts";
import type { ReferenceParts } from "./resource-reference.ts";
import { evaluate } from "../execute/evaluate.ts";
const BASE = "https://api.github.com/repos/TheSwanFactory/hclang/";
const JSON_TYPE = "application/json; charset=utf-8";
const FIXTURES: Record<string, RestFixture> = {
  "": { status: 200, headers: { "content-type": JSON_TYPE }, body: "{}" },
  "issues/277": {
    status: 200,
    headers: {
      "content-type": JSON_TYPE,
      "set-cookie": "session=secret",
      "x-internal": "hidden",
    },
    body: '{"number":277}',
  },
  "moved": {
    status: 301,
    headers: { location: "https://evil.example/stolen" },
    body: "",
  },
  "broken": { status: 500, body: "boom" },
  "slow": { status: 200, body: "late", delayMs: 5_000 },
  "large": { status: 200, body: "x".repeat(200) },
};
/** Counts every application that reaches the table entry, by verb. */
class CountingHandler implements SchemeHandler {
  public applications = 0;
  public constructor(private readonly inner: RestHandler) {}
  public describe(): string {
    return this.inner.describe();
  }
  public read(reference: ReferenceParts): HandlerRead {
    this.applications++;
    return this.inner.read(reference);
  }
  public write(reference: ReferenceParts, content: string): HandlerWrite {
    this.applications++;
    return this.inner.write(reference, content);
  }
  public exchange(reference: ReferenceParts, request: Frame): HandlerExchange {
    this.applications++;
    return this.inner.exchange(reference, request);
  }
}
/** One simulated grant under a fresh root, with a hand-set clock. */
const harness = (overrides: Partial<RestGrantSpec> = {}) => {
  const clock = { now: 0 };
  const evidence = new MemoryEvidence();
  const simulator = new RestSimulator(BASE, FIXTURES, evidence);
  const grant = new RestGrant(
    {
      base: BASE,
      requests: 10,
      responseBytes: 100,
      timeoutMs: 1_000,
      lifetimeMs: 60_000,
      ...overrides,
    },
    simulator,
    () => clock.now,
  );
  const handler = new CountingHandler(new RestHandler([grant]));
  const store = new MemoryStore();
  const root = FrameResource.root(
    store,
    ResourceHandlers.of({ https: handler }),
  );
  const run = (source: string): string => {
    const answer = evaluate(`.api '${BASE}'; ${source}`, {
      [RESOURCE_ROOT_KEY]: root,
    }).asArray().at(-1);
    const last = answer?.asArray().at(-1);
    return (last ?? Frame.nil).toString();
  };
  return { clock, evidence, simulator, grant, handler, run, store };
};
const refusal = (reason: string, literal = BASE) => `$!.${reason} '${literal}'`;
describe("REST resource", () => {
  describe("application is one GET", () => {
    it("answers a response record of ordinary values", () => {
      const { run, simulator } = harness();
      expect(run(`(api [.path “issues/277”]).status`)).toEqual("200");
      expect(run(`(api [.path “issues/277”]).body`)).toEqual(
        '“{"number":277}”',
      );
      expect(simulator.calls).toEqual([
        { method: "GET", url: `${BASE}issues/277`, headers: {} },
        { method: "GET", url: `${BASE}issues/277`, headers: {} },
      ]);
    });
    it("sends the query and allowed headers it was given", () => {
      const { run, simulator } = harness();
      run(
        `api [.path “issues”, .query [.state “open”], .headers [.accept “a/b”]]`,
      );
      expect(simulator.calls).toEqual([{
        method: "GET",
        url: `${BASE}issues?state=open`,
        headers: { accept: "a/b" },
      }]);
    });
    it("requests the base without its slash for an empty record", () => {
      const { run, simulator } = harness();
      expect(run(`(api []).status`)).toEqual("200");
      expect(simulator.calls[0].url).toEqual(BASE.slice(0, -1));
    });
    it("shows only allowlisted response headers", () => {
      const { run } = harness();
      expect(run(`(api [.path “issues/277”]).headers`)).toEqual(
        `[.content-type “${JSON_TYPE}”;]`,
      );
    });
    it("answers any status as data, and never follows a redirect", () => {
      const { run, simulator } = harness();
      expect(run(`(api [.path “moved”]).status`)).toEqual("301");
      expect(run(`(api [.path “moved”]).headers.location`)).toEqual(
        "“https://evil.example/stolen”",
      );
      expect(run(`api [.path ((api [.path “moved”]).headers.location)]`))
        .toEqual(refusal("resource-scheme-unbound"));
      expect(run(`(api [.path “nowhere”]).status`)).toEqual("404");
      expect(simulator.calls.every((call) => call.url.startsWith(BASE)))
        .toEqual(true);
    });
  });
  describe("reading", () => {
    it("is a GET of the base, answered as characters", () => {
      const { run } = harness();
      expect(run(`api | “”`)).toEqual("“{}”");
    });
    it("answers resource-absent for 404 and resource-status otherwise", () => {
      const fixtures = { "": { status: 500 } };
      const evidence = new MemoryEvidence();
      const grant = new RestGrant(
        {
          base: BASE,
          requests: 5,
          responseBytes: 100,
          timeoutMs: 100,
          lifetimeMs: 1_000,
        },
        new RestSimulator(BASE, fixtures, evidence),
      );
      const handler = new RestHandler([grant]);
      const parts = { scheme: "https", authority: "api.github.com" };
      expect(
        handler.read({ ...parts, path: "/repos/TheSwanFactory/hclang/" }),
      ).toEqual({ ok: false, reason: "resource-status 500" });
      const absent = new RestHandler([
        new RestGrant(
          {
            base: BASE,
            requests: 5,
            responseBytes: 100,
            timeoutMs: 100,
            lifetimeMs: 1_000,
          },
          new RestSimulator(BASE, {}, evidence),
        ),
      ]);
      expect(absent.read({ ...parts, path: "/repos/TheSwanFactory/hclang/" }))
        .toEqual({ ok: false, reason: "resource-absent" });
    });
  });
  describe("adversarial attempts fail closed", () => {
    it("cannot reach another origin or a sub-path by writing a literal", () => {
      const { run, simulator } = harness();
      for (
        const literal of [
          "https://evil.example/",
          `${BASE}issues/`,
          "https://api.github.com/repos/TheSwanFactory/",
          "https://user@api.github.com/repos/TheSwanFactory/hclang/",
        ]
      ) {
        expect(run(`'${literal}' [.path “x”]`)).toEqual(
          refusal("resource-unbound", literal),
        );
        expect(run(`'${literal}' | “”`)).toEqual(
          refusal("resource-unbound", literal),
        );
      }
      expect(simulator.calls).toEqual([]);
    });
    it("cannot escape the path scope", () => {
      const { run, simulator } = harness();
      for (
        const [path, reason] of [
          ["../hclang-other", "resource-parent-escape"],
          ["issues/../../x", "resource-parent-escape"],
          ["%2e%2e/x", "resource-encoded-separator"],
          ["%2E%2E%2Fx", "resource-encoded-separator"],
          ["a%5cb", "resource-encoded-separator"],
          ["//evil.example/x", "resource-authority-unbound"],
          ["https://evil.example/x", "resource-scheme-unbound"],
          ["x?y=1", "resource-part-unsupported"],
        ]
      ) {
        expect(run(`api [.path “${path}”]`)).toEqual(refusal(reason));
      }
      expect(simulator.calls).toEqual([]);
    });
    it("cannot send anything but a GET, or a body", () => {
      const { run, simulator } = harness();
      for (
        const request of [
          `[.method “POST”]`,
          `[.method “GET”]`,
          `[.body “x”]`,
          `“a string”`,
          `7`,
          `[.path “x”, 1]`,
          `[.path 1]`,
          `[.query [.a 1]]`,
          `[.headers “accept”]`,
        ]
      ) {
        expect(run(`api ${request}`)).toEqual(
          refusal("resource-request-shape"),
        );
      }
      expect(simulator.calls).toEqual([]);
    });
    it("cannot set a forbidden header", () => {
      const { run, simulator } = harness();
      for (
        const name of ["authorization", "cookie", "host", "proxy-authorization"]
      ) {
        expect(run(`api [.headers [.${name} “x”]]`)).toEqual(
          refusal("resource-header-forbidden"),
        );
      }
      expect(simulator.calls).toEqual([]);
    });
    it("cannot exceed the request budget, however it repeats", () => {
      const { run, simulator } = harness({ requests: 2 });
      expect(run(`.k {api [.path “issues/277”]}; [k (), k ()]`)).toContain(
        "200",
      );
      expect(run(`.b api; b [.path “issues/277”]`)).toEqual(
        refusal("resource-budget requests"),
      );
      expect(run(`'${BASE}' [.path “issues/277”]`)).toEqual(
        refusal("resource-budget requests"),
      );
      expect(simulator.calls.length).toEqual(2);
    });
    it("spends a request on a transport failure, with no retry", () => {
      const evidence = new MemoryEvidence();
      let sends = 0;
      const failing: RestTransport = {
        describe: () => "failing",
        send: (_request, stub) => {
          sends++;
          evidence.append({
            ...stub,
            outcome: "sent",
            status: null,
            responseBytes: 0,
            refusal: "resource-transport",
          });
          return { ok: false, reason: "resource-transport" };
        },
        record: (record) => evidence.append(record),
      };
      const grant = new RestGrant({
        base: BASE,
        requests: 1,
        responseBytes: 10,
        timeoutMs: 10,
        lifetimeMs: 1_000,
      }, failing);
      const request = {
        ok: true as const,
        request: { query: [], headers: [] },
      };
      expect(grant.exchange(request)).toEqual({
        ok: false,
        reason: "resource-transport",
      });
      expect(grant.exchange(request)).toEqual({
        ok: false,
        reason: "resource-budget requests",
      });
      expect(sends).toEqual(1);
      expect(evidence.records.length).toEqual(2);
    });
    it("cannot exceed the response-size, time or lifetime budgets", () => {
      const { run, clock, grant } = harness();
      expect(run(`api [.path “large”]`)).toEqual(
        refusal("resource-budget response-size"),
      );
      expect(run(`api [.path “slow”]`)).toEqual(
        refusal("resource-transport timeout"),
      );
      clock.now = 60_001;
      expect(run(`api [.path “issues/277”]`)).toEqual(
        refusal("resource-budget lifetime"),
      );
      expect(grant.requestsSent()).toEqual(2);
    });
    it("answers resource-revoked once the harness revokes the grant", () => {
      const { run, grant, simulator } = harness();
      grant.revoke();
      expect(run(`api [.path “issues/277”]`)).toEqual(
        refusal("resource-revoked"),
      );
      expect(run(`api | “”`)).toEqual(refusal("resource-revoked"));
      expect(simulator.calls).toEqual([]);
    });
    it("gains nothing from a second literal, an alias or a closure", () => {
      const { run, grant } = harness({ requests: 3 });
      run(`.again '${BASE}'; again [.path “issues/277”]`);
      run(`.m_ api; m_ [.path “issues/277”]`);
      run(`.outer {.inner {api [.path “issues/277”]}; inner ()}; outer ()`);
      expect(run(`api [.path “issues/277”]`)).toEqual(
        refusal("resource-budget requests"),
      );
      expect(grant.requestsSent()).toEqual(3);
    });
    it("returns no Frame with authority, and no raw host callback", () => {
      const { run, simulator } = harness();
      const response = evaluate(`.api '${BASE}'; api [.path “issues/277”]`, {
        [RESOURCE_ROOT_KEY]: FrameResource.root(
          new MemoryStore(),
          ResourceHandlers.of({
            https: new RestHandler([
              new RestGrant({
                base: BASE,
                requests: 1,
                responseBytes: 100,
                timeoutMs: 100,
                lifetimeMs: 1_000,
              }, new RestSimulator(BASE, FIXTURES)),
            ]),
          }),
        ),
      }).asArray().at(-1)!.asArray().at(-1)!;
      const reachable = (frame: Frame, seen = new Set<Frame>()): Frame[] => {
        if (seen.has(frame)) return [];
        seen.add(frame);
        return [
          frame,
          ...frame.meta_keys().flatMap((key) =>
            reachable(frame.getOwn(key), seen)
          ),
        ];
      };
      const frames = reachable(response);
      expect(frames.some((frame) => frame instanceof FrameResource)).toEqual(
        false,
      );
      expect(frames.map((frame) => frame.className()).sort()).toEqual([
        "FrameArray",
        "FrameArray",
        "FrameCount",
        "FrameString",
        "FrameString",
      ]);
      for (
        const probe of [
          "api.handler",
          "api.grants",
          "api.transport",
          "api.handlers",
          "api.store",
          "$$.root.handlers",
        ]
      ) {
        expect(run(probe)).toContain("name-missing");
      }
      // Applying a response to a request is ordinary aggregate application:
      // it collects the record, and sends nothing.
      run(`(api [.path “issues/277”]) [.path “issues/277”]`);
      expect(simulator.calls.length).toEqual(1);
    });
  });
  describe("evidence", () => {
    it("records exactly one entry per application, sent or refused", () => {
      const { run, evidence, handler } = harness({ requests: 2 });
      run(`api [.path “issues/277”]`);
      run(`api [.path “../x”]`);
      run(`api [.method “POST”]`);
      run(`api | “”`);
      run(`'https://evil.example/' [.path “x”]`);
      run(`api [.path “issues/277”]`);
      run(`api [.path “large”]`);
      expect(handler.applications).toEqual(7);
      expect(evidence.records.length).toEqual(7);
      expect(evidence.records.map((record) => record.outcome)).toEqual([
        "sent",
        "refused",
        "refused",
        "sent",
        "refused",
        "refused",
        "refused",
      ]);
      const first: RestEvidence = evidence.records[0];
      expect(first).toEqual({
        grant: BASE,
        at: "1970-01-01T00:00:00.000Z",
        method: "GET",
        url: `${BASE}issues/277`,
        outcome: "sent",
        status: 200,
        responseBytes: 14,
        refusal: null,
      });
      expect(evidence.records[4].grant).toEqual(null);
      expect(evidence.records[4].refusal).toEqual("resource-unbound");
    });
    it("holds no request header value", () => {
      const { run, evidence } = harness();
      run(`api [.path “issues/277”, .headers [.accept “secret-value”]]`);
      run(`api [.headers [.authorization “token-value”]]`);
      const text = JSON.stringify(evidence.records);
      expect(text).not.toContain("secret-value");
      expect(text).not.toContain("token-value");
    });
    it("fails closed when an append fails, discarding the response", () => {
      const { run, evidence, simulator } = harness();
      evidence.failing = true;
      expect(run(`api [.path “issues/277”]`)).toEqual(
        refusal("resource-evidence"),
      );
      expect(run(`api [.path “../x”]`)).toEqual(refusal("resource-evidence"));
      expect(run(`api | “”`)).toEqual(refusal("resource-evidence"));
      expect(simulator.calls.length).toEqual(2);
    });
    it("cannot be suppressed, forged or redirected from HC", () => {
      const { run, evidence, store } = harness();
      run(`'./evidence.jsonl' “{\\"forged\\":true}”`);
      run(`api [.path “issues/277”]`);
      expect(store.read("evidence.jsonl").ok).toEqual(true);
      expect(evidence.records.length).toEqual(1);
      expect(JSON.stringify(evidence.records)).not.toContain("forged");
    });
  });
});
