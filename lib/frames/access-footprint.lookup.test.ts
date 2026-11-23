import { expect } from "jsr:@std/expect@^0.219.1";
import { describe, it } from "jsr:@std/testing@^1.0.10/bdd";
import { evaluate } from "../execute/evaluate.ts";
import { Frame } from "./frame.ts";
import { FrameName } from "./frame-name.ts";
import { FrameResource } from "./frame-resource.ts";
import { FrameSymbol } from "./frame-symbol.ts";
import { BoundMethod } from "./bound-method.ts";
import { FrameLazy } from "./frame-lazy.ts";
import { MemoryStore } from "./resource-store.ts";
import { RESOURCE_ROOT_KEY } from "./resource-binding.ts";
import {
  isOpaque,
  isState,
  nameLookup,
  potentialFootprint,
} from "./access-footprint.ts";
import { dispatch, type DispatchEvent } from "./event-dispatch.ts";
import { AccessRecord, withAccessRecord } from "./reference-tracking.ts";
import { readName } from "../test-helpers.test.ts";

/**
 * Differential tests for #527: the footprint walk reads each bare name through
 * lookup's own traversal, so the frames it certifies for a name are the frames
 * lookup consults. The fixtures cover the three differences the old mirror had
 * (a declared parent's lexical `up`; `lookup_here` and `lookup_links`
 * overrides; visibility graded from the target rather than the reading scope)
 * and a fourth, the argument layer, which lookup reads with `getOwn`.
 */

/** An event: a method `owner.key`, or the closure under `key`. */
type EventSpec =
  | { readonly method: readonly [string, string] }
  | { readonly closure: string; readonly argument?: string };

interface Fixture {
  readonly id: string;
  readonly program: string;
  /** The source of `m.hc`, when the program imports it. */
  readonly module?: string;
  readonly event: EventSpec;
  /** The bare name the event body reads first. */
  readonly name: string;
  /** What the event answers under `sequential`. */
  readonly result: string;
}

const NS_PARENT =
  `.x [.tag 1]; .mk {.x [.tag 7]; M <- './m.hc'; M}; .M (mk ()); .C [.^ M; .m {x.tag}]; .ev {C.m ()};`;
const NS_IN_CALL =
  `.mk {.x [.tag 7]; M <- './m.hc'; M}; .M (mk ()); .ev {M.get ()};`;
/**
 * A namespace imported inside a call, whose method is a closure made in
 * another call: the receiver layer is a handle, so lookup does not climb the
 * namespace's `up` into the importing call, where `x` is shadowed.
 */
const NS_FOREIGN_METHOD =
  `.x [.tag 1]; .mkreader {{x.tag}}; .reader (mkreader ()); .mk {.x [.tag 7]; M <- './m.hc'; M}; .M (mk ()); .ev {M.get ()};`;
const numeric = (parent: string, result: string): Fixture => ({
  id: `2n ${parent}`,
  program: `.k [.tag 1]; .C [.^ ${parent}; .f {k.tag}];`,
  event: { method: ["C", "f"] },
  name: "k",
  result,
});

const FIXTURES: readonly Fixture[] = [
  {
    id: "1b",
    program: NS_PARENT,
    module: ".k 1;",
    event: { method: ["C", "m"] },
    name: "x",
    result: "7",
  },
  {
    id: "1c",
    program:
      `.mk {.y [.tag 7]; M <- './m.hc'; M}; .M (mk ()); .C [.^ M; .m {y.tag}];`,
    module: ".k 1;",
    event: { method: ["C", "m"] },
    name: "y",
    result: "7",
  },
  {
    id: "1e",
    program: NS_PARENT,
    module: ".k 1;",
    event: { closure: "ev" },
    name: "C",
    result: "7",
  },
  {
    id: "2a",
    program: `.x [.tag 1]; M <- './m.hc'; .ev {M.get ()};`,
    module: ".get {x.tag};",
    event: { method: ["M", "get"] },
    name: "x",
    result: "1",
  },
  {
    id: "2c",
    program: NS_IN_CALL,
    module: ".get {x.tag};",
    event: { method: ["M", "get"] },
    name: "x",
    result: "7",
  },
  {
    id: "2e",
    program: NS_IN_CALL,
    module: ".get {x.tag};",
    event: { closure: "ev" },
    name: "M",
    result: "7",
  },
  {
    id: "2f",
    program: NS_FOREIGN_METHOD,
    module: ".get reader;",
    event: { method: ["M", "get"] },
    name: "x",
    result: "1",
  },
  {
    id: "2g",
    program: NS_FOREIGN_METHOD,
    module: ".get reader;",
    event: { closure: "ev" },
    name: "M",
    result: "1",
  },
  {
    id: "2d",
    program: ".body [.tag 1]; .d ```\ntext\n```; .C [.^ d; .m {body}];",
    event: { method: ["C", "m"] },
    name: "body",
    result: "“\ntext\n”",
  },
  numeric("9.8", "9.8.k.tag"),
  numeric("9.8.m", "9.8.m.k.tag"),
  numeric("3", "1"),
  numeric("7.1.2", "1"),
  {
    id: "3a",
    program:
      ".outer [._inner-secret [.k 1]; .nested [.read {inner-secret.k}]]; .n outer.nested;",
    event: { method: ["n", "read"] },
    name: "inner-secret",
    result: "$!.is-protected .inner-secret",
  },
  {
    id: "3b",
    program: ".base [.__hidden [.k 7]]; .derived [.^ base; .m {hidden.k}];",
    event: { method: ["derived", "m"] },
    name: "hidden",
    result: "$!.is-private .hidden",
  },
  {
    id: "3c",
    program:
      ".x_ [.n 5; .set_ {@n _;}]; .base [.__poke {x_.set_ 1}]; .derived [.^ base; .m {poke ()}]; .read-x {x_.n};",
    event: { method: ["derived", "m"] },
    name: "poke",
    result: "$!.is-private .poke",
  },
  {
    id: "3d",
    program: ".owner [.__secret [.k 3]; .m {secret.k}];",
    event: { method: ["owner", "m"] },
    name: "secret",
    result: "3",
  },
  {
    id: "4a",
    program:
      ".x [.tag 1]; .apply {x.tag}; .mk {.x [.tag 7]; {0}}; .arg (mk ());",
    event: { closure: "apply", argument: "arg" },
    name: "x",
    result: "1",
  },
];

/** A fresh evaluation of the fixture, with `m.hc` in a memory store. */
const load = (fixture: Fixture): Frame => {
  const store = new MemoryStore();
  if (fixture.module !== undefined) store.write("m.hc", fixture.module);
  return evaluate(fixture.program, {
    [RESOURCE_ROOT_KEY]: FrameResource.root(store),
  });
};

const eventOf = (scope: Frame, spec: EventSpec): DispatchEvent =>
  "method" in spec
    ? {
      label: spec.method.join("."),
      target: readName(scope, spec.method[0]).get(spec.method[1]),
    }
    : {
      label: spec.closure,
      target: readName(scope, spec.closure),
      argument: spec.argument === undefined
        ? undefined
        : readName(scope, spec.argument),
    };

/** One event, run in a fresh evaluation under `policy`. */
const run = (
  fixture: Fixture,
  policy: "sequential" | "certified-sequential" | "footprint",
) => dispatch([eventOf(load(fixture), fixture.event)], policy).outcomes[0];

/** The shared state an event's run actually read. */
const actualReads = (outcome: { actual: AccessRecord }): Set<Frame> =>
  new Set(outcome.actual.sharedReads().filter(isState));

const hasCallScope = (fixture: Fixture): boolean =>
  "method" in fixture.event || fixture.event.argument !== undefined;

describe("footprint names follow lookup (#527)", () => {
  describe("a name's footprint is what lookup consults", () => {
    for (const fixture of FIXTURES.filter(hasCallScope)) {
      it(`${fixture.id}: ${fixture.name}`, () => {
        const event = eventOf(load(fixture), fixture.event);
        const target = event.target;
        if (!(target instanceof BoundMethod || target instanceof FrameLazy)) {
          throw new Error(`${fixture.id}: no callable target`);
        }
        // The call scope, taken as the walk takes it.
        const scratch = new AccessRecord();
        const scope = withAccessRecord(
          scratch,
          () => target.scopeForCall(event.argument ?? Frame.nil),
        );
        if (scope instanceof Frame) {
          throw new Error(`${fixture.id}: call refused: ${scope}`);
        }
        const symbol = FrameSymbol.for(fixture.name);
        const shared = (frames: readonly Frame[]): Set<Frame> =>
          new Set(
            frames.filter((frame) =>
              isState(frame) && !scratch.created.has(frame)
            ),
          );
        const record = new AccessRecord();
        const answer = withAccessRecord(record, () => symbol.in(scope));
        const lookup = nameLookup(symbol, scope);
        expect(shared(lookup.consulted)).toEqual(shared(record.sharedReads()));
        expect(lookup.found?.value.toString()).toEqual(answer.toString());
      });
    }
  });

  describe("every read the event makes is certified", () => {
    for (const fixture of FIXTURES) {
      it(`${fixture.id} answers ${fixture.result} under its own certificate`, () => {
        const plain = run(fixture, "sequential");
        const guarded = run(fixture, "certified-sequential");
        expect(plain.result.toString()).toEqual(fixture.result);
        expect(isOpaque(plain.potential)).toBe(false);
        for (const frame of actualReads(plain)) {
          expect(plain.potential.reads.has(frame)).toBe(true);
        }
        expect(guarded.refused).toBeUndefined();
        expect(guarded.result.toString()).toEqual(fixture.result);
      });
    }
  });

  describe("the certificate names nothing lookup does not consult", () => {
    // 3b certifies `base.__hidden`, which no lookup reads: the walk reads the
    // receiver with everything reachable from it (`Walk.read`), and the
    // hidden member is reachable from `derived` through its declared parent.
    for (const fixture of FIXTURES.filter((each) => each.id !== "3b")) {
      it(fixture.id, () => {
        const plain = run(fixture, "sequential");
        expect(new Set(plain.potential.reads)).toEqual(actualReads(plain));
      });
    }

    it("3c certifies no write of the private method it cannot call", () => {
      const fixture = FIXTURES.find((each) => each.id === "3c")!;
      expect([...run(fixture, "sequential").potential.writes]).toEqual([]);
      const scope = load(fixture);
      const report = dispatch([
        eventOf(scope, fixture.event),
        { label: "read-x", target: readName(scope, "read-x") },
      ], "footprint");
      expect(report.outcomes.map((each) => each.result.toString())).toEqual([
        "$!.is-private .poke",
        "5",
      ]);
      expect(report.outcomes[1].waitedFor).toEqual([]);
    });
  });

  it("a pattern binding on a lookup frame makes the name opaque and is not rewritten", () => {
    const scope = evaluate(".ev {kz};");
    const seed = new FrameName("seed");
    scope.set("/k.*/", seed);
    const footprint = potentialFootprint(readName(scope, "ev"));
    expect(isOpaque(footprint)).toBe(true);
    expect(footprint.unresolved).toContain("/pattern/ kz");
    expect(seed.source).toBe("seed");
  });

  it("inference under an outer guard asks nothing of it", () => {
    const fixture = FIXTURES.find((each) => each.id === "1b")!;
    const scope = load(fixture);
    const target = eventOf(scope, fixture.event).target;
    const alone = potentialFootprint(target);
    const outer = new AccessRecord();
    outer.guard = (frame) => !isState(frame);
    const nested = withAccessRecord(outer, () => potentialFootprint(target));
    expect(new Set(nested.reads)).toEqual(new Set(alone.reads));
    expect(isOpaque(nested)).toBe(false);
  });
});
