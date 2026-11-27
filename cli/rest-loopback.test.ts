/**
 * The live worker transport against a loopback server this test starts.
 *
 * Runs as `deno task test:rest-loopback`, with net permission for `127.0.0.1`
 * only, so it exercises the real `--rest` startup check, the real worker, the
 * real `fetch` and the real evidence file, without leaving the machine. The
 * server runs in its own worker, because the main isolate blocks in
 * `Atomics.wait` while each request is in flight.
 */
import { expect } from "@std/expect";
import { afterAll, beforeAll, describe, it } from "@std/testing/bdd";
import {
  Frame,
  FrameResource,
  MemoryStore,
  RESOURCE_ROOT_KEY,
  ResourceHandlers,
  type RestEvidence,
} from "../lib/frames.ts";
import { evaluate } from "../lib/execute/evaluate.ts";
import { attenuateRestPolicy } from "../lib/frames/rest-authority.ts";
import { restGrantPolicy } from "../lib/frames/rest-policy.ts";
import { loadRestConfig, type RestInstall } from "./rest-config.ts";
import { LiveTransport } from "./rest-worker.ts";
/** One request the loopback server received. */
interface Received {
  readonly method: string;
  readonly path: string;
  readonly headers: Record<string, string>;
}
const SERVER = `
const server = Deno.serve({ hostname: "127.0.0.1", port: 0, onListen() {} },
  async (request) => {
    const url = new URL(request.url);
    self.postMessage({ kind: "request", method: request.method,
      path: url.pathname + url.search,
      headers: Object.fromEntries(request.headers.entries()) });
    const json = { "content-type": "application/json; charset=utf-8" };
    switch (url.pathname) {
      case "/api/issues/277":
        return new Response('{"number":277}', { headers: { ...json,
          "set-cookie": "session=secret", "x-internal": "hidden",
          etag: "W/\\"277\\"" } });
      case "/api":
        return new Response('{"api":true}', { headers: json });
      case "/api/moved":
        return new Response("", { status: 302,
          headers: { location: "http://127.0.0.1:" + server.addr.port + "/outside" } });
      case "/api/large":
        return new Response("x".repeat(100000));
      case "/api/slow":
        await new Promise((resolve) => setTimeout(resolve, 2000));
        return new Response("late");
      case "/api/broken":
        return new Response("boom", { status: 500 });
      case "/api/huge-header":
        return new Response("", { headers: { link: "x".repeat(70000) } });
      case "/api/bytes":
        return new Response(new Uint8Array([0x61, 0xff, 0x62]));
      default:
        return new Response('{"message":"Not Found"}', { status: 404, headers: json });
    }
  });
self.postMessage({ kind: "listening", port: server.addr.port });
`;
let server: Worker;
let port = 0;
const received: Received[] = [];
let directory = "";
const configFile = (grants: unknown[]): string => {
  const file = `${directory}/grants-${crypto.randomUUID()}.json`;
  Deno.writeTextFileSync(file, JSON.stringify(grants));
  return file;
};
const grant = (overrides: Record<string, unknown> = {}) => ({
  base: `http://127.0.0.1:${port}/api/`,
  transport: "live",
  requests: 50,
  responseBytes: 1000,
  timeoutMs: 500,
  lifetimeMs: 60_000,
  evidence: "evidence/loopback.jsonl",
  ...overrides,
});
/** Lets the server worker's messages arrive. */
const settle = () => new Promise((resolve) => setTimeout(resolve, 100));
/** Drops what the server received before this point. */
const reset = async () => {
  await settle();
  received.length = 0;
};
describe("live REST transport over loopback", () => {
  let install: RestInstall;
  let base = "";
  const run = (source: string): string => {
    const answer = evaluate(`.api '${base}'; ${source}`, {
      [RESOURCE_ROOT_KEY]: FrameResource.root(
        new MemoryStore(),
        ResourceHandlers.of(install.handlers),
      ),
    }).asArray().at(-1);
    return (answer?.asArray().at(-1) ?? Frame.nil).toString();
  };
  const evidence = (): RestEvidence[] =>
    Deno.readTextFileSync(`${directory}/evidence/loopback.jsonl`).trim()
      .split("\n").map((line) => JSON.parse(line));
  const refusal = (reason: string) => `$!.${reason} '${base}'`;
  beforeAll(async () => {
    directory = Deno.makeTempDirSync({ prefix: "hc-rest-loopback-" });
    server = new Worker(
      URL.createObjectURL(
        new Blob([SERVER], { type: "application/javascript" }),
      ),
      { type: "module" },
    );
    port = await new Promise<number>((resolve) => {
      server.onmessage = (event) => {
        if (event.data.kind === "listening") resolve(event.data.port);
        else received.push(event.data);
      };
    });
    install = loadRestConfig(configFile([grant()]), "/nonexistent-root");
    base = install.grants[0].base;
  });
  afterAll(() => {
    install.close();
    server.terminate();
    Deno.removeSync(directory, { recursive: true });
  });
  it("sends an authorized GET and answers ordinary values", async () => {
    await reset();
    expect(run(`(api [.path “issues/277”]).status`)).toEqual("200");
    expect(run(`(api [.path “issues/277”]).body`)).toEqual(
      '“{"number":277}”',
    );
    expect(run(`(api [.path “issues/277”]).headers`)).toEqual(
      `[.content-length “14”; .content-type “application/json; charset=utf-8”; .etag “W/"277"”;]`,
    );
    expect(run(`api | “”`)).toEqual('“{"api":true}”');
    await settle();
    expect(received.map((each) => [each.method, each.path])).toEqual([
      ["GET", "/api/issues/277"],
      ["GET", "/api/issues/277"],
      ["GET", "/api/issues/277"],
      ["GET", "/api"],
    ]);
    expect(received.every((each) => each.headers.authorization === undefined))
      .toEqual(true);
  });
  it("sends the query and allowed headers", async () => {
    await reset();
    run(
      `api [.path “issues”, .query [.state “open”], .headers [.accept “a/b”]]`,
    );
    await settle();
    expect(received).toHaveLength(1);
    expect(received[0].path).toEqual("/api/issues?state=open");
    expect(received[0].headers.accept).toEqual("a/b");
  });
  it("answers statuses as data and never follows a redirect", async () => {
    await reset();
    expect(run(`(api [.path “moved”]).status`)).toEqual("302");
    expect(run(`(api [.path “moved”]).headers.location`)).toEqual(
      `“http://127.0.0.1:${port}/outside”`,
    );
    expect(run(`(api [.path “nowhere”]).status`)).toEqual("404");
    expect(run(`(api [.path “broken”]).status`)).toEqual("500");
    await settle();
    expect(received.some((each) => each.path === "/outside")).toEqual(false);
  });
  it("replaces invalid UTF-8 rather than failing", () => {
    expect(run(`(api [.path “bytes”]).body`)).toEqual("“a\uFFFDb”");
  });
  it("refuses origin, path, method and header attempts before sending", async () => {
    await reset();
    const outside = `http://127.0.0.1:${port}/outside/`;
    expect(run(`'${outside}' [.path “x”]`)).toEqual(
      `$!.resource-unbound '${outside}'`,
    );
    expect(run(`api [.path “../outside”]`)).toEqual(
      refusal("resource-parent-escape"),
    );
    expect(run(`api [.path “%2e%2e/outside”]`)).toEqual(
      refusal("resource-encoded-separator"),
    );
    expect(run(`api [.method “POST”]`)).toEqual(
      refusal("resource-method-forbidden"),
    );
    expect(run(`api [.headers [.authorization “x”]]`)).toEqual(
      refusal("resource-header-forbidden"),
    );
    await settle();
    expect(received).toEqual([]);
  });
  it("enforces the response-size and timeout budgets in the worker", () => {
    expect(run(`api [.path “large”]`)).toEqual(
      refusal("resource-budget response-size"),
    );
    expect(run(`api [.path “slow”]`)).toEqual(
      refusal("resource-transport timeout"),
    );
  });
  it("writes one evidence line per application, outside the root", () => {
    const before = evidence().length;
    run(`api [.path “issues/277”, .headers [.accept “secret-value”]]`);
    run(`api [.path “../x”]`);
    const after = evidence();
    expect(after.length).toEqual(before + 2);
    expect(after.at(-2)).toMatchObject({
      grant: base,
      method: "GET",
      url: `${base}issues/277`,
      outcome: "sent",
      status: 200,
      responseBytes: 14,
      refusal: null,
    });
    expect(after.at(-1)).toMatchObject({
      outcome: "refused",
      refusal: "resource-parent-escape",
    });
    expect(JSON.stringify(after)).not.toContain("secret-value");
  });
  it("fails closed when the evidence append fails", async () => {
    await reset();
    Deno.mkdirSync(`${directory}/blocked/evidence.jsonl`, { recursive: true });
    const blocked = loadRestConfig(
      configFile([grant({ evidence: "blocked/evidence.jsonl" })]),
      "/nonexistent-root",
    );
    try {
      const answer = evaluate(`'${base}' [.path “issues/277”]`, {
        [RESOURCE_ROOT_KEY]: FrameResource.root(
          new MemoryStore(),
          ResourceHandlers.of(blocked.handlers),
        ),
      }).toString();
      expect(answer).toContain("$!.resource-evidence");
      expect(answer).not.toContain("277}");
    } finally {
      blocked.close();
    }
    await settle();
    expect(received).toHaveLength(1);
  });
  it("answers resource-transport when allowlisted headers overflow", () => {
    expect(run(`api [.path “huge-header”]`)).toEqual(
      refusal("resource-transport"),
    );
  });
  it("records a main-isolate refusal through the worker, failing closed", () => {
    Deno.mkdirSync(`${directory}/blocked2/evidence.jsonl`, { recursive: true });
    const blocked = loadRestConfig(
      configFile([grant({ evidence: "blocked2/evidence.jsonl" })]),
      "/nonexistent-root",
    );
    try {
      const answer = evaluate(`'${base}' [.path “../x”]`, {
        [RESOURCE_ROOT_KEY]: FrameResource.root(
          new MemoryStore(),
          ResourceHandlers.of(blocked.handlers),
        ),
      }).toString();
      expect(answer).toContain("$!.resource-evidence");
    } finally {
      blocked.close();
    }
  });
  describe("the worker re-verifies against its own grant", () => {
    const policy = () =>
      restGrantPolicy({
        base,
        requests: 5,
        responseBytes: 1000,
        timeoutMs: 500,
        lifetimeMs: 60_000,
      });
    const stub = (url: string | null) => ({
      grant: base,
      at: new Date(0).toISOString(),
      method: "GET",
      url,
    });
    const outgoing = (url: string, headers: Record<string, string> = {}) => ({
      url,
      headers,
      timeoutMs: 500,
      responseBytes: 1000,
    });
    it("refuses a URL, stub or header the main isolate should have", async () => {
      await reset();
      const live = new LiveTransport(
        policy(),
        `${directory}/evidence/direct.jsonl`,
      );
      try {
        const outside = `http://127.0.0.1:${port}/outside`;
        expect(live.send(outgoing(outside), stub(outside))).toEqual({
          ok: false,
          reason: "resource-escaped-root",
        });
        expect(live.send(outgoing(`${base}issues`), stub(`${base}other`)))
          .toEqual({ ok: false, reason: "resource-escaped-root" });
        expect(
          live.send(
            outgoing(`${base}issues`, { authorization: "x" }),
            stub(`${base}issues`),
          ),
        ).toEqual({ ok: false, reason: "resource-header-forbidden" });
      } finally {
        live.close();
      }
      await settle();
      expect(received).toEqual([]);
      expect(
        Deno.readTextFileSync(`${directory}/evidence/direct.jsonl`).trim()
          .split("\n"),
      ).toHaveLength(3);
    });
    it("answers resource-transport when the connection fails", () => {
      const listener = Deno.listen({ hostname: "127.0.0.1", port: 0 });
      const closed = (listener.addr as Deno.NetAddr).port;
      listener.close();
      const closedBase = `http://127.0.0.1:${closed}/api/`;
      const live = new LiveTransport(
        restGrantPolicy({
          base: closedBase,
          requests: 1,
          responseBytes: 10,
          timeoutMs: 2_000,
          lifetimeMs: 60_000,
        }),
        `${directory}/evidence/closed.jsonl`,
      );
      try {
        expect(
          live.send(outgoing(`${closedBase}x`), {
            ...stub(`${closedBase}x`),
            grant: closedBase,
          }),
        ).toEqual({ ok: false, reason: "resource-transport" });
      } finally {
        live.close();
      }
    });
    it("stops waiting for a worker that never answers", () => {
      const live = new LiveTransport(
        policy(),
        `${directory}/evidence/stopped.jsonl`,
        0,
      );
      live.close();
      expect(
        live.send(
          { ...outgoing(`${base}issues`), timeoutMs: 50 },
          stub(`${base}issues`),
        ),
      ).toEqual({ ok: false, reason: "resource-transport closed" });
      expect(live.describe()).toContain("live");
    });
  });
  it("refuses to start with broader net permission than the grants", () => {
    expect(
      Deno.permissions.querySync({ name: "net", host: "example.invalid" })
        .state,
    ).not.toEqual("granted");
    expect(() =>
      loadRestConfig(
        configFile([grant({
          base: "https://api.github.com/repos/TheSwanFactory/hclang/",
        })]),
        "/nonexistent-root",
      )
    ).toThrow("net permission is not granted for api.github.com");
  });
});

Deno.test({
  name: "credentialed workers enforce installed children and uncertain effects",
  permissions: {
    env: ["HC_REST_TEST_TOKEN"],
    net: ["127.0.0.1"],
    read: true,
    write: true,
  },
  async fn(): Promise<void> {
    const temp = Deno.makeTempDirSync({ prefix: "hc-rest-auth-" });
    const token = "fake-worker-only-token";
    Deno.env.set("HC_REST_TEST_TOKEN", token);
    const seen: {
      method: string;
      authorization: string;
      body: string;
      path: string;
    }[] = [];
    const code = `
      const server = Deno.serve({hostname:"127.0.0.1",port:0,onListen(){}}, async (request) => {
        self.postMessage({kind:"received",method:request.method,authorization:request.headers.get("authorization"),body:await request.text(),path:new URL(request.url).pathname});
        const path = new URL(request.url).pathname;
        if (path.endsWith("/drop")) return new Response(new ReadableStream({ start(controller) { controller.enqueue(new Uint8Array([1])); setTimeout(()=>controller.error(new Error("dropped")),5); } }));
        if (path.endsWith("/slow")) { await new Promise(resolve=>setTimeout(resolve,200)); return new Response("late"); }
        if (path.endsWith("/large")) return new Response("x".repeat(200));
        if (path.endsWith("/evidence-fail")) {
          const file = ${JSON.stringify(temp + "/effects.jsonl")};
          Deno.renameSync(file, file+".saved"); Deno.mkdirSync(file);
        }
        return new Response("ok", {status:201});
      });
      self.postMessage({kind:"listening",port:server.addr.port});`;
    const server = new Worker(
      URL.createObjectURL(new Blob([code], { type: "application/javascript" })),
      { type: "module" },
    );
    const port = await new Promise<number>((resolve) => {
      server.onmessage = (event) => {
        if (event.data.kind === "listening") resolve(event.data.port);
        else seen.push(event.data);
      };
    });
    const base = `http://127.0.0.1:${port}/api/`;
    const credential = {
      env: "HC_REST_TEST_TOKEN",
      scheme: "bearer",
      create: "https://example.com/token",
      permissions: "test only",
    };
    const root = {
      id: "root",
      base,
      methods: ["GET", "POST"],
      requestBytes: 20,
      requests: 20,
      responseBytes: 1000,
      timeoutMs: 1000,
      lifetimeMs: 60000,
      evidence: "effects.jsonl",
      transport: "live",
      credential,
    };
    const file = `${temp}/grants.json`;
    Deno.writeTextFileSync(
      file,
      JSON.stringify({
        grants: [root, {
          id: "read",
          attenuates: "root",
          path: "issues/",
          methods: ["GET"],
          responseBytes: 10,
          timeoutMs: 40,
        }, {
          ...root,
          id: "other",
          base: `http://127.0.0.1:${port}/other/`,
          evidence: "other.jsonl",
        }],
        install: ["read", "other"],
      }),
    );
    let install: RestInstall | undefined;
    const direct: LiveTransport[] = [];
    try {
      install = loadRestConfig(file, "/nonexistent-root");
      expect(() => Deno.env.get("HC_REST_TEST_TOKEN")).toThrow();
      const read = install.grants[0];
      const send = (path: string, method = "GET", body?: string) =>
        read.exchange({
          ok: true,
          request: { path, method, body, query: [], headers: [] },
        });
      expect(send("1").ok).toBe(true);
      expect(send("1", "POST")).toMatchObject({
        reason: "resource-method-forbidden",
      });
      expect(send("../outside")).toMatchObject({
        reason: "resource-parent-escape",
      });
      expect(send("large")).toMatchObject({
        reason: "resource-budget response-size",
      });
      expect(send("slow")).toMatchObject({
        reason: "resource-transport timeout",
      });
      const other = install.grants[1];
      expect(
        other.exchange({ ok: true, request: { query: [], headers: [] } }).ok,
      ).toBe(true);
      const serialized = JSON.stringify(install.handlers);
      expect(serialized).not.toContain(token);
      expect(read.requestsSent()).toBe(3);
      expect(read.exchange({ ok: false, reason: "resource-request-shape" }))
        .toMatchObject({ reason: "resource-request-shape" });
      read.revoke();
      expect(send("1")).toMatchObject({ reason: "resource-revoked" });
      // Scope a second transport without reading the now-revoked token in the main isolate.
      const parentPolicy = restGrantPolicy(root);
      const childPolicy = attenuateRestPolicy(parentPolicy, {
        path: "issues/",
        methods: ["GET"],
      });
      const worker = new LiveTransport(
        parentPolicy,
        `${temp}/forged.jsonl`,
        undefined,
        {
          definitions: [
            { id: "root", policy: parentPolicy, installed: false },
            {
              id: "read",
              policy: childPolicy,
              parent: "root",
              installed: true,
            },
          ],
        },
      );
      direct.push(worker);
      expect(
        worker.record({
          grant: null,
          at: new Date().toISOString(),
          method: "GET",
          url: null,
          outcome: "refused",
          status: null,
          responseBytes: 0,
          refusal: "resource-unbound",
        }),
      ).toBe(true);
      const legacy = new LiveTransport(parentPolicy, `${temp}/legacy.jsonl`);
      direct.push(legacy);
      expect(
        legacy.send({
          url: base.slice(0, -1),
          headers: {},
          method: "GET",
          timeoutMs: 1000,
          responseBytes: 1000,
        }, {
          grant: base,
          at: new Date().toISOString(),
          method: "GET",
          url: base.slice(0, -1),
        }).ok,
      ).toBe(true);
      worker.revoke("unknown-id");
      expect(worker.requestsSent("unknown-id")).toBe(0);
      expect(
        worker.send({
          url: `${base}outside`,
          method: "POST",
          headers: {},
          timeoutMs: 1000,
          responseBytes: 1000,
        }, {
          grant: base,
          at: new Date().toISOString(),
          method: "POST",
          url: `${base}outside`,
        }),
      ).toMatchObject({ reason: "resource-unbound" });
      const raw = (path: string, method = "GET") => ({
        ok: true as const,
        request: { path, method, query: [], headers: [] },
      });
      expect(worker.authorize("root", raw(""))).toMatchObject({
        reason: "resource-unbound",
      });
      expect(worker.authorize("read", raw("1", "POST"))).toMatchObject({
        reason: "resource-method-forbidden",
      });
      expect(worker.authorize("read", raw("../outside"))).toMatchObject({
        reason: "resource-parent-escape",
      });
      expect(
        worker.authorize(
          "read",
          {
            ok: true,
            request: { ...raw("1").request, responseBytes: 99999 },
          } as never,
        ),
      ).toMatchObject({ reason: "resource-request-shape" });
      const effects = new LiveTransport(
        parentPolicy,
        `${temp}/effects-write.jsonl`,
        undefined,
        {
          definitions: [{ id: "write", policy: parentPolicy, installed: true }],
        },
      );
      direct.push(effects);
      expect(effects.authorize("write", raw("write", "POST")).ok).toBe(true);
      expect(effects.authorize("write", raw("drop", "POST"))).toMatchObject({
        reason: expect.stringMatching(/^resource-effect-uncertain /),
      });
      const records = Deno.readTextFileSync(`${temp}/effects-write.jsonl`)
        .trim().split("\n").map((line) => JSON.parse(line));
      expect(records.map((record) => record.phase)).toEqual([
        "intent",
        "completion",
        "intent",
        "completion",
      ]);
      expect(records[0].requestId).toBe(records[1].requestId);
      // The server makes the evidence target unwritable only after the intent is appended.
      const failing = new LiveTransport(
        parentPolicy,
        `${temp}/effects.jsonl`,
        undefined,
        {
          definitions: [{ id: "write", policy: parentPolicy, installed: true }],
        },
      );
      direct.push(failing);
      expect(failing.authorize("write", raw("evidence-fail", "POST")))
        .toMatchObject({
          reason: expect.stringMatching(/^resource-effect-uncertain /),
        });
      // Intent failure is definite and must not send a second request.
      expect(failing.authorize("write", raw("write", "POST"))).toMatchObject({
        reason: "resource-evidence",
      });
      const stalled = new LiveTransport(
        parentPolicy,
        `${temp}/stalled.jsonl`,
        -995,
        {
          definitions: [{ id: "write", policy: parentPolicy, installed: true }],
        },
      );
      direct.push(stalled);
      expect(stalled.authorize("write", raw("slow", "POST"))).toMatchObject({
        reason: expect.stringMatching(/^resource-effect-uncertain /),
      });
      expect(() => stalled.ready()).toThrow("REST worker startup failed");
      expect(stalled.requestsSent("write")).toBe(0);
      expect(stalled.authorize("write", raw("write", "POST"))).toMatchObject({
        reason: "resource-transport closed",
      });
      await new Promise((resolve) => setTimeout(resolve, 250));
      expect(
        seen.filter((request) => request.authorization === `Bearer ${token}`),
      ).toHaveLength(4);
      expect(Deno.readTextFileSync(`${temp}/other.jsonl`)).not.toContain(token);
      expect(seen.filter((request) => request.path === "/api/write"))
        .toHaveLength(1);
      expect(seen.filter((request) => request.path === "/api/drop"))
        .toHaveLength(1);
      const completions = Deno.readTextFileSync(`${temp}/effects-write.jsonl`);
      expect(completions).not.toContain(token);
    } finally {
      install?.close();
      for (const transport of direct) transport.close();
      server.terminate();
      Deno.removeSync(temp, { recursive: true });
    }
  },
});

Deno.test({
  name: "missing selected credential stops startup before evaluation",
  permissions: {
    env: ["HC_REST_MISSING_TEST"],
    net: ["127.0.0.1"],
    read: true,
    write: true,
  },
  fn(): void {
    const temp = Deno.makeTempDirSync();
    const file = `${temp}/grants.json`;
    Deno.env.delete("HC_REST_MISSING_TEST");
    Deno.writeTextFileSync(
      file,
      JSON.stringify([{
        base: "http://127.0.0.1:1/api/",
        transport: "live",
        requests: 1,
        responseBytes: 10,
        timeoutMs: 50,
        lifetimeMs: 1000,
        evidence: "missing.jsonl",
        credential: {
          env: "HC_REST_MISSING_TEST",
          scheme: "bearer",
          create: "https://example.com/token",
          permissions: "test only",
        },
      }]),
    );
    try {
      expect(() => loadRestConfig(file, "/nonexistent-root")).toThrow(
        "HC_REST_MISSING_TEST is unset or unavailable",
      );
    } finally {
      Deno.removeSync(temp, { recursive: true });
    }
  },
});
Deno.test("bare allow-env cannot start a credentialed evaluator", () => {
  const temp = Deno.makeTempDirSync();
  const file = `${temp}/grants.json`;
  Deno.env.set("HC_REST_BROAD_TEST", "fake");
  Deno.writeTextFileSync(
    file,
    JSON.stringify([{
      base: "http://127.0.0.1:1/api/",
      transport: "live",
      requests: 1,
      responseBytes: 10,
      timeoutMs: 50,
      lifetimeMs: 1000,
      evidence: "broad.jsonl",
      credential: {
        env: "HC_REST_BROAD_TEST",
        scheme: "bearer",
        create: "https://example.com/token",
        permissions: "test only",
      },
    }]),
  );
  try {
    expect(() => loadRestConfig(file, "/nonexistent-root")).toThrow(
      "remains accessible",
    );
  } finally {
    Deno.env.delete("HC_REST_BROAD_TEST");
    Deno.removeSync(temp, { recursive: true });
  }
});

Deno.test({
  name:
    "an unavailable credential cannot be bypassed through the transport API",
  permissions: {
    env: ["HC_REST_UNAVAILABLE"],
    net: ["127.0.0.1"],
    read: true,
    write: true,
  },
  fn(): void {
    Deno.env.delete("HC_REST_UNAVAILABLE");
    const temp = Deno.makeTempDirSync();
    const policy = restGrantPolicy({
      base: "http://127.0.0.1:1/api/",
      requests: 1,
      responseBytes: 10,
      timeoutMs: 50,
      lifetimeMs: 1000,
    });
    const transport = new LiveTransport(
      policy,
      `${temp}/evidence.jsonl`,
      undefined,
      {
        credentialEnv: "HC_REST_UNAVAILABLE",
        definitions: [{ id: "r", policy, installed: true }],
      },
    );
    try {
      expect(transport.ready()).toBe(false);
      expect(
        transport.authorize("r", {
          ok: true,
          request: { query: [], headers: [] },
        }),
      ).toMatchObject({ reason: "resource-unbound" });
      expect(transport.requestsSent("r")).toBe(0);
    } finally {
      transport.close();
      Deno.removeSync(temp, { recursive: true });
    }
  },
});

Deno.test({
  name:
    "API-key credentials stay worker-only and cannot be supplied or replaced by HC",
  permissions: {
    env: ["REST_TEST_API_KEY"],
    net: ["127.0.0.1"],
    read: true,
    write: true,
  },
  async fn(): Promise<void> {
    const temp = Deno.makeTempDirSync({ prefix: "hc-rest-api-key-" });
    Deno.env.set("REST_TEST_API_KEY", "fake-header-key");
    const seen: { key: string | null; authorization: string | null }[] = [];
    const server = new Worker(
      URL.createObjectURL(
        new Blob(
          [`
      const server=Deno.serve({hostname:"127.0.0.1",port:0,onListen(){}},request=>{
        self.postMessage({kind:"received",key:request.headers.get("x-api-key"),authorization:request.headers.get("authorization")});
        return new Response("ok");
      });
      self.postMessage({kind:"listening",port:server.addr.port});
    `],
          { type: "application/javascript" },
        ),
      ),
      { type: "module" },
    );
    const port = await new Promise<number>((resolve) => {
      server.onmessage = (event) => {
        if (event.data.kind === "listening") resolve(event.data.port);
        else seen.push(event.data);
      };
    });
    const base = `http://127.0.0.1:${port}/api/`;
    const file = `${temp}/grants.json`;
    Deno.writeTextFileSync(
      file,
      JSON.stringify({
        grants: [{
          id: "root",
          base,
          methods: ["GET"],
          requests: 3,
          responseBytes: 100,
          timeoutMs: 1000,
          lifetimeMs: 60000,
          transport: "live",
          evidence: "evidence.jsonl",
          credential: {
            env: "REST_TEST_API_KEY",
            scheme: "x-api-key",
            create: "https://example.com/key",
            permissions: "read",
          },
        }, { id: "child", attenuates: "root", path: "recordings/1/" }],
        install: ["child"],
      }),
    );
    let install: RestInstall | undefined;
    try {
      install = loadRestConfig(file, "/nonexistent-root");
      expect(() => Deno.env.get("REST_TEST_API_KEY")).toThrow();
      const child = install.grants[0];
      expect(
        child.exchange({
          ok: true,
          request: { path: "summary", query: [], headers: [] },
        }),
      ).toMatchObject({ ok: true });
      expect(
        child.exchange({
          ok: true,
          request: {
            path: "summary",
            query: [],
            headers: [["X-Api-Key", "replace"]],
          },
        }),
      ).toMatchObject({ reason: "resource-header-forbidden" });
      expect(
        child.exchange({
          ok: true,
          request: {
            path: "summary",
            query: [],
            headers: [["authorization", "replace"]],
          },
        }),
      ).toMatchObject({ reason: "resource-header-forbidden" });
      await new Promise((resolve) => setTimeout(resolve, 50));
      expect(seen).toHaveLength(1);
      expect(seen[0]).toMatchObject({
        key: "fake-header-key",
        authorization: null,
      });
      const evidence = Deno.readTextFileSync(`${temp}/evidence.jsonl`);
      expect(evidence).not.toContain("fake-header-key");
      expect(evidence).not.toContain("replace");
    } finally {
      install?.close();
      server.terminate();
      Deno.removeSync(temp, { recursive: true });
    }
  },
});
