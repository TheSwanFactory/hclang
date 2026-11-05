import { expect } from "jsr:@std/expect@^0.219.1";
import { describe, it } from "jsr:@std/testing@^1.0.10/bdd";

import { evaluate } from "../execute/evaluate.ts";
import { Frame } from "./frame.ts";
import { FrameArray } from "./frame-array.ts";
import { FrameCount } from "./frame-count.ts";
import { FrameSymbol } from "./frame-symbol.ts";
import { EvaluationScope } from "./evaluation-scope.ts";
import {
  AccessRecord,
  holdersOf,
  mutableHoldersOf,
  noteRead,
  noteWrite,
  versionOf,
  withAccessRecord,
} from "./reference-tracking.ts";

const describeHolding = (holding: { key: string; mutable: boolean }): string =>
  `${holding.key}${holding.mutable ? "!" : ""}`;

/** Reads a name as a statement would, so the answer is a handle. */
const read = (scope: Frame, key: string): Frame =>
  FrameSymbol.for(key).in(EvaluationScope.root(scope));

describe("reference tracking: holders of an identity (ART inverse index)", () => {
  it("lists every binding that holds an aggregate, graded by its marker", () => {
    const scope = evaluate(`
      .x_ [.n 1; .set_ {@n _;}];
      .y_ x_;
      .z x_;
    `);
    const x = scope.get_here("x_");
    const holders = holdersOf(x);
    expect(holders.map((h) => h.holder)).toEqual([scope, scope, scope]);
    expect(holders.map(describeHolding).sort()).toEqual(["x_!", "y_!", "z"]);
    expect(mutableHoldersOf(x).map(describeHolding).sort()).toEqual([
      "x_!",
      "y_!",
    ]);
  });

  it("indexes a member held under a marked key of another aggregate", () => {
    const scope = evaluate(`
      .e_ [.n 1];
      .h [.inner_ e_];
    `);
    const e = scope.get_here("e_");
    const h = scope.get_here("h");
    const keys = holdersOf(e).map((holding) =>
      `${holding.holder === h ? "h" : "file"}.${describeHolding(holding)}`
    );
    expect(keys.sort()).toEqual(["file.e_!", "h.inner_!"]);
  });

  it("releases a holding when the key is rebound", () => {
    const scope = evaluate(`
      .a_ [.n 1];
      .b_ [.n 2];
      .k_ a_;
    `);
    const a = scope.get_here("a_");
    const b = scope.get_here("b_");
    expect(holdersOf(a).map(describeHolding).sort()).toEqual(["a_!", "k_!"]);
    scope.set("k_", b);
    expect(holdersOf(a).map(describeHolding)).toEqual(["a_!"]);
    expect(holdersOf(b).map(describeHolding).sort()).toEqual(["b_!", "k_!"]);
  });

  it("counts a copy as a holder of the members it shares", () => {
    const scope = evaluate(`.o [.inner_ [.n 1]; .touch_ {@n 2;}];`);
    const o = scope.get_here("o");
    const inner = o.get_here("inner_");
    const copy = o.instanceCopy();
    expect(holdersOf(inner).map((h) => h.holder)).toContain(copy);
  });

  it("does not index atoms or closures, which own no identity", () => {
    const scope = evaluate(`.n 1; .f {1};`);
    expect(holdersOf(scope.get_here("n"))).toEqual([]);
    expect(holdersOf(scope.get_here("f"))).toEqual([]);
  });
});

describe("reference tracking: element and parent holdings", () => {
  const where = (
    holdings: { holder: Frame; key: string; kind: string; mutable: boolean }[],
    holder: Frame,
  ): string[] =>
    holdings.filter((h) => h.holder === holder).map((h) =>
      `${h.kind}:${describeHolding(h)}`
    ).sort();

  it("indexes an element of an aggregate literal under its index, mutably", () => {
    const scope = evaluate(`
      .x_ [.n 5; .set_ {@n _;}];
      .xs [x_, 7];
    `);
    const x = scope.get_here("x_");
    const xs = scope.get_here("xs");
    expect(where(holdersOf(x), xs)).toEqual(["element:0!"]);
    expect(where(holdersOf(x), scope)).toEqual(["member:x_!"]);
    // The index hands out the identity itself: a write through an immutable
    // outer name lands on the shared element.
    read(scope, "xs").get("0").get("set_").call(FrameCount.for("9"));
    expect(x.get_here("n").toString()).toBe("9");
    expect(mutableHoldersOf(x).map((h) => h.holder)).toContain(xs);
  });

  it("registers an appended element and releases every element on reset", () => {
    const scope = evaluate(`.x_ [.n 1]; .y_ [.n 2]; .xs_ [y_];`);
    const x = scope.get_here("x_");
    const y = scope.get_here("y_");
    const xs = scope.get_here("xs_") as FrameArray;
    expect(where(holdersOf(x), xs)).toEqual([]);
    xs.collect(x);
    expect(where(holdersOf(x), xs)).toEqual(["element:1!"]);
    expect(where(holdersOf(y), xs)).toEqual(["element:0!"]);
    xs.reset();
    expect(where(holdersOf(x), xs)).toEqual([]);
    expect(where(holdersOf(y), xs)).toEqual([]);
    expect(xs.length()).toBe(0);
  });

  it("swaps the holding when an element is replaced in place", () => {
    const a = new FrameArray([FrameCount.for("1")]);
    const b = new FrameArray([FrameCount.for("2")]);
    const xs = new FrameArray([a, FrameCount.for("0"), a]);
    expect(where(holdersOf(a), xs)).toEqual(["element:0!", "element:2!"]);
    expect(xs.replaceMember(a, b)).toBe(true);
    expect(where(holdersOf(a), xs)).toEqual([]);
    expect(where(holdersOf(b), xs)).toEqual(["element:0!", "element:2!"]);
  });

  it("counts a copy as a holder of the elements it shares", () => {
    const scope = evaluate(`.x_ [.n 1]; .xs [x_];`);
    const x = scope.get_here("x_");
    const xs = scope.get_here("xs") as FrameArray;
    const copy = xs.instanceCopy();
    expect(where(holdersOf(x), copy)).toEqual(["element:0!"]);
    const collected = xs.collectingCopy();
    expect(where(holdersOf(x), collected)).toEqual(["element:0!"]);
  });

  it("indexes a declared parent under ^ without authority, and follows a rebind", () => {
    const scope = evaluate(`
      .p_ [.n 1];
      .q_ [.n 2];
      .c_ [.^ p_; .m 3];
    `);
    const p = scope.get_here("p_");
    const q = scope.get_here("q_");
    const c = scope.get_here("c_");
    expect(where(holdersOf(p), c)).toEqual(["parent:^"]);
    expect(mutableHoldersOf(p).map((h) => h.holder)).not.toContain(c);
    expect(c.setParent(q)).toBeUndefined();
    expect(where(holdersOf(p), c)).toEqual([]);
    expect(where(holdersOf(q), c)).toEqual(["parent:^"]);
    // A copy carries the parent edge, so it holds the parent too.
    const copy = c.instanceCopy();
    expect(where(holdersOf(q), copy)).toEqual(["parent:^"]);
  });

  it("holds a parent reached through an element and a member at once", () => {
    const scope = evaluate(`.p [.n 1]; .h [.inner_ p; [.^ p]];`);
    const p = scope.get_here("p");
    const h = scope.get_here("h") as FrameArray;
    const child = h.at(0);
    expect(where(holdersOf(p), h)).toEqual(["member:inner_!"]);
    expect(where(holdersOf(p), child)).toEqual(["parent:^"]);
    expect(holdersOf(p).map((h) => h.kind).sort()).toEqual([
      "member",
      "member",
      "parent",
    ]);
  });
});

describe("reference tracking: state versions", () => {
  it("advances an aggregate's version on each committed write", () => {
    const x = new FrameArray([]);
    const start = versionOf(x);
    const one = FrameCount.for("1");
    x.set("n", one);
    expect(versionOf(x)).toBe(start + 1);
    // Re-assigning the same frame is not a mutation (effect-registry.ts).
    x.set("n", one);
    expect(versionOf(x)).toBe(start + 1);
    x.set("n", FrameCount.for("2"));
    expect(versionOf(x)).toBe(start + 2);
    x.collect(FrameCount.for("3"));
    expect(versionOf(x)).toBe(start + 3);
  });

  it("advances on a mutation through an HC method and not on a functional update", () => {
    const scope = evaluate(`.x_ [.n 1; .set_ {@n _;}]; .z x_;`);
    const x = scope.get_here("x_");
    const before = versionOf(x);
    evaluate(`.x_ [.n 1; .set_ {@n _;}];`);
    expect(versionOf(x)).toBe(before);
    read(scope, "x_").get("set_").call(FrameCount.for("5"));
    expect(versionOf(x)).toBe(before + 1);
    read(scope, "z").get("set_").call(FrameCount.for("7"));
    expect(versionOf(x)).toBe(before + 1);
    expect(x.get_here("n").toString()).toBe("5");
  });
});

describe("reference tracking: actual access of an active record", () => {
  it("records keyed reads and committed writes, dated by version", () => {
    const x = new FrameArray([]);
    x.set("n", FrameCount.for("1"));
    const record = new AccessRecord();
    withAccessRecord(record, () => {
      x.get_here("n");
      x.set("n", FrameCount.for("2"));
    });
    expect(record.reads.get(x)).toBe(versionOf(x) - 1);
    expect(record.writes.get(x)).toBe(versionOf(x));
  });

  it("records nothing outside an active record", () => {
    const x = new FrameArray([]);
    const record = new AccessRecord();
    noteRead(x);
    noteWrite(x);
    expect(record.reads.size).toBe(0);
    expect(record.writes.size).toBe(0);
  });

  it("separates an event's own fresh frames from shared ones", () => {
    const scope = evaluate(`.x_ [.n 1; .set_ {@n _;}]; .z x_;`);
    const x = scope.get_here("x_");
    const record = new AccessRecord();
    const copy = withAccessRecord(
      record,
      () => read(scope, "z").get("set_").call(FrameCount.for("9")),
    );
    expect(copy.referent()).not.toBe(x);
    expect(record.writes.has(copy.referent())).toBe(true);
    expect(record.created.has(copy.referent())).toBe(true);
    expect(record.sharedWrites()).not.toContain(copy.referent());
    expect(record.sharedWrites()).not.toContain(x);
    expect(record.sharedReads()).toContain(x);
  });

  it("sees a write made through a nested callee and through an alias", () => {
    const scope = evaluate(`
      .x_ [.n 1; .set_ {@n _;}];
      .y_ x_;
      .w_ [.inner_ x_; .poke_ {inner_.set_ _}];
    `);
    const x = scope.get_here("x_");
    const record = new AccessRecord();
    withAccessRecord(
      record,
      () => read(scope, "w_").get("poke_").call(FrameCount.for("4")),
    );
    expect(record.sharedWrites()).toEqual([x]);
    const viaAlias = new AccessRecord();
    withAccessRecord(
      viaAlias,
      () => read(scope, "y_").get("set_").call(FrameCount.for("6")),
    );
    expect(viaAlias.sharedWrites()).toEqual([x]);
    expect(x.get_here("n").toString()).toBe("6");
  });

  it("is a no-op for a plain Frame constructed outside any record", () => {
    const record = new AccessRecord();
    const frame = new Frame();
    expect(record.created.has(frame)).toBe(false);
  });
});
