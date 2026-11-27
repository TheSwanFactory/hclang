/**
 * The REST security invariant, tested over generated hostile programs.
 *
 * For an arbitrary HC program, every request a transport receives must be a
 * `GET` under the base of the grant it went through, and every application of
 * a REST resource must produce exactly one evidence record. An `http:` literal
 * reaches no table entry at all (`$!.resource-scheme-unbound`), so it is no
 * REST application and writes no record. The generator
 * composes applications of granted and ungranted literals with random request
 * records, aliases, closures, nested scopes, mutation and repetition, and runs
 * them against recording simulated transports.
 *
 * Seeded, so each run repeats the same cases, and a failure names its seed and
 * program.
 */
import { expect } from "@std/expect";
import { describe, it } from "@std/testing/bdd";
import {
  type Frame,
  FrameResource,
  type HandlerExchange,
  type HandlerRead,
  type HandlerWrite,
  MemoryEvidence,
  MemoryStore,
  RESOURCE_ROOT_KEY,
  ResourceHandlers,
  RestGrant,
  RestHandler,
  RestSimulator,
  type SchemeHandler,
} from "../frames.ts";
import type { ReferenceParts } from "./resource-reference.ts";
import { evaluate } from "../execute/evaluate.ts";
const API = "https://api.github.com/repos/TheSwanFactory/hclang/";
const ISSUES = `${API}issues/`;
const GRANTED = [API, ISSUES];
const UNGRANTED = [
  "https://evil.example/",
  "https://api.github.com/repos/TheSwanFactory/",
  "https://api.github.com/repos/TheSwanFactory/hclang-other/",
  `${API}pulls/`,
  "http://api.github.com/repos/TheSwanFactory/hclang/",
  "https://user@api.github.com/repos/TheSwanFactory/hclang/",
];
const PATHS = [
  "",
  "issues/277",
  "issues",
  "../hclang-other",
  "..",
  "a/../../b",
  "%2e%2e/x",
  "%2E%2E%2Fx",
  "a%2fb",
  "a%5cb",
  "a\\\\b",
  "//evil.example/x",
  "https://evil.example/x",
  "/absolute",
  "x?y=1",
  "x#frag",
  "%zz",
  "a%3Fb",
  "./issues/./277",
  "ünïcode/✓",
];
const HEADERS = [
  "accept",
  "Accept-Language",
  "authorization",
  "Cookie",
  "host",
  "proxy-authorization",
  "x-custom",
  "if-none-match",
];
/** Counts every application that reaches a table entry. */
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
/** A seeded xorshift32 generator. */
class Seeded {
  public constructor(private state: number) {}
  public next(): number {
    let value = this.state | 0;
    value ^= value << 13;
    value ^= value >>> 17;
    value ^= value << 5;
    this.state = value >>> 0;
    return this.state;
  }
  public pick<T>(items: readonly T[]): T {
    return items[this.next() % items.length];
  }
  public chance(percent: number): boolean {
    return this.next() % 100 < percent;
  }
}
/** A random request: a record that may hold any key, or not a record at all. */
const request = (random: Seeded): string => {
  if (random.chance(8)) return random.pick([`“issues/277”`, `7`, `api`]);
  const parts: string[] = [];
  if (random.chance(70)) parts.push(`.path “${random.pick(PATHS)}”`);
  if (random.chance(25)) {
    parts.push(`.query [.${random.pick(["state", "q"])} “open”]`);
  }
  if (random.chance(30)) {
    parts.push(`.headers [.${random.pick(HEADERS)} “v”]`);
  }
  if (random.chance(10)) {
    parts.push(random.pick([
      `.method “POST”`,
      `.body “x”`,
      `.path 1`,
      `.url “https://evil.example/”`,
    ]));
  }
  return `[${parts.join(", ")}]`;
};
/** A random literal, granted or not. */
const literal = (random: Seeded): string =>
  `'${random.chance(60) ? random.pick(GRANTED) : random.pick(UNGRANTED)}'`;
/**
 * A random hostile program, as statements, and how many REST applications it
 * performs.
 *
 * Each statement applies a resource it reached one way or another: directly,
 * through an alias, a mutable alias reassigned, a closure capture, a nested
 * scope, a repetition, or a read.
 */
const program = (random: Seeded): { source: string; applications: number } => {
  const bound = (written: string): number =>
    written.startsWith("'https:") ? 1 : 0;
  const first = literal(random);
  const viaApi = bound(first);
  const lines = [`.api ${first};`];
  let applications = 0;
  const statements = 3 + random.next() % 6;
  for (let i = 0; i < statements; i++) {
    const req = request(random);
    switch (random.next() % 8) {
      case 0:
        lines.push(`api ${req};`);
        applications += viaApi;
        break;
      case 1: {
        const written = literal(random);
        lines.push(`${written} ${req};`);
        applications += bound(written);
        break;
      }
      case 2:
        lines.push(`.alias${i} api; alias${i} ${req};`);
        applications += viaApi;
        break;
      case 3: {
        const written = literal(random);
        lines.push(`.box${i}_ [.r ${written}]; box${i}_.r ${req};`);
        applications += bound(written);
        break;
      }
      case 4: {
        const written = literal(random);
        lines.push(`.k${i} {${written} ${req}}; k${i} ();`);
        applications += bound(written);
        break;
      }
      case 5:
        lines.push(`.o${i} {.i {api ${req}}; i ()}; o${i} ();`);
        applications += viaApi;
        break;
      case 6: {
        const times = 1 + random.next() % 3;
        lines.push(
          `.rep${i} {api ${req}}; [${
            Array.from({ length: times }, () => `rep${i} ()`).join(", ")
          }];`,
        );
        applications += times * viaApi;
        break;
      }
      default: {
        const written = literal(random);
        lines.push(`${written} | “”;`);
        applications += bound(written);
      }
    }
  }
  return { source: lines.join("\n"), applications };
};
const CASES = 150;
describe("REST hostile programs", () => {
  it("send only GETs under their grant's base, with one record each", () => {
    let sent = 0;
    let refused = 0;
    for (let index = 0; index < CASES; index++) {
      const seed = 0x277 + index * 7919;
      const random = new Seeded(seed);
      const { source, applications } = program(random);
      const evidence = new MemoryEvidence();
      const simulators = GRANTED.map((base) =>
        new RestSimulator(base, {
          "issues/277": { status: 200, body: "{}" },
          "277": { status: 200, body: "{}" },
        }, evidence)
      );
      const grants = GRANTED.map((base, i) =>
        new RestGrant({
          base,
          requests: 4,
          responseBytes: 1_000,
          timeoutMs: 1_000,
          lifetimeMs: 60_000,
        }, simulators[i])
      );
      const handler = new CountingHandler(new RestHandler(grants));
      const root = FrameResource.root(
        new MemoryStore(),
        ResourceHandlers.of({ https: handler }),
      );
      const context = `seed ${seed}:\n${source}`;
      evaluate(source, { [RESOURCE_ROOT_KEY]: root });
      simulators.forEach((simulator, i) => {
        for (const call of simulator.calls) {
          expect(call.method, context).toEqual("GET");
          const sent = new URL(call.url);
          const base = new URL(GRANTED[i]);
          expect(sent.origin, context).toEqual(base.origin);
          expect(
            sent.pathname === base.pathname.slice(0, -1) ||
              sent.pathname.startsWith(base.pathname),
            context,
          ).toEqual(true);
          expect(sent.username + sent.password + sent.hash, context).toEqual(
            "",
          );
          for (const name of Object.keys(call.headers)) {
            expect(
              ["authorization", "cookie", "host"].includes(name) ||
                name.startsWith("proxy-"),
              context,
            ).toEqual(false);
          }
        }
        expect(simulator.calls.length, context).toBeLessThanOrEqual(4);
      });
      expect(handler.applications, context).toEqual(applications);
      expect(evidence.records.length, context).toEqual(applications);
      sent += simulators.reduce((sum, each) => sum + each.calls.length, 0);
      refused += evidence.records.filter((record) =>
        record.outcome === "refused"
      ).length;
    }
    // Not vacuous: the programs both send and get refused, many times.
    console.log(`hostile programs: ${sent} sent, ${refused} refused`);
    expect(sent).toBeGreaterThan(50);
    expect(refused).toBeGreaterThan(200);
  });
});

describe("hostile programs with installed attenuated writers", () => {
  it("cannot recover a private ancestor or exceed shared policy through composition", () => {
    let effects = 0;
    for (let index = 0; index < CASES; index++) {
      const random = new Seeded(0x570 + index * 7919);
      const generated = program(random);
      const evidence = new MemoryEvidence();
      const simulator = new RestSimulator(API, {
        "issues/277": { status: 201, body: "{}" },
      }, evidence);
      const parent = new RestGrant({
        base: API,
        methods: ["GET", "POST"],
        requestBytes: 8,
        requests: 4,
        responseBytes: 1000,
        timeoutMs: 1000,
        lifetimeMs: 60000,
      }, simulator);
      const child = parent.attenuate({
        path: "issues/",
        methods: index % 2 ? ["GET"] : ["GET", "POST"],
      });
      const handler = new CountingHandler(new RestHandler([child]));
      const root = FrameResource.root(
        new MemoryStore(),
        ResourceHandlers.of({ https: handler }),
      );
      const source = generated.source +
        `\n'${ISSUES}' [.path “277”, .method “POST”, .body “é”];`;
      evaluate(source, { [RESOURCE_ROOT_KEY]: root });
      for (const call of simulator.calls) {
        const pathname = new URL(call.url).pathname;
        const scope = new URL(ISSUES).pathname;
        expect(pathname.startsWith(scope) || pathname === scope.slice(0, -1))
          .toBe(true);
        expect(child.policy.methods).toContain(call.method);
        expect(Object.keys(call.headers)).not.toContain("authorization");
        expect(new TextEncoder().encode(call.body ?? "").length)
          .toBeLessThanOrEqual(8);
      }
      expect(simulator.calls.length).toBeLessThanOrEqual(4);
      expect(parent.requestsSent()).toBe(simulator.calls.length);
      const applications = evidence.records.filter((record) =>
        record.phase !== "completion"
      );
      expect(applications).toHaveLength(handler.applications);
      for (
        const intent of evidence.records.filter((record) =>
          record.phase === "intent"
        )
      ) {
        expect(
          evidence.records.filter((record) =>
            record.requestId === intent.requestId
          ),
        ).toHaveLength(2);
        effects++;
      }
    }
    expect(effects).toBeGreaterThan(20);
  });
});
