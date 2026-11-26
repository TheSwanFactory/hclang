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
import { loadRestConfig, type RestInstall } from "./rest-config.ts";
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
      refusal("resource-request-shape"),
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
