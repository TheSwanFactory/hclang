import { expect } from "jsr:@std/expect@^0.219.1";
import {
  Frame,
  FrameArray,
  FrameCount,
  FrameDecimal,
  FrameExpr,
  FrameInt,
  FrameNote,
  FrameNumber,
  FrameString,
} from "../frames.ts";
import { FrameHandle } from "../frames/frame-handle.ts";
import { HC_SOURCES } from "../bundle/hc-sources.ts";
import { Add, GreaterThan, Multiply, Subtract } from "../ops/math.ts";
import { evaluate } from "./evaluate.ts";
import {
  constructDenum,
  DENUM_SOURCE,
  denumClass,
  loadDenumClass,
} from "./denum-prologue.ts";

const count = (n: bigint): FrameCount => new FrameCount(n);

/**
 * The value a source's last statement answers, unwrapped. A source of several
 * statements answers a group of them; an aggregate, a Denum included, answers
 * itself.
 */
const value = (source: string): Frame => {
  let answer = FrameExpr.answeredValue(evaluate(source).at(-1)).referent();
  while (!(answer instanceof FrameArray) && answer.asArray().length > 1) {
    answer = FrameExpr.answeredValue(answer.asArray().at(-1)!).referent();
  }
  return answer;
};

/** A Denum's Count and loads, read from the fields of the HC instance. */
const state = (denum: Frame): string[] =>
  ["count", "left", "right"].map((key) => `${denum.getOwn(key)}`);

/** A Denum's derived phase: 2 for an even Count, 1 for an odd one. */
const phase = (denum: Frame): string => `${denum.getOwn("phase")}`;

/** `d x` through an immutable name, as HC applies a named Denum. */
const deposit = (d: Frame, x: Frame): Frame =>
  FrameExpr.answeredValue(new FrameHandle(d, false).call(x)).referent();

Deno.test("the fourth hash constructs the HC class in a bare evaluator with no root", () => {
  // A bare evaluate has no root, so it can import nothing, bundled or not.
  expect(evaluate("X <- './hc/denum.hc'; X").toString()).toContain("$!");
  // Yet .#### answers an instance of the class in hc/denum.hc.
  const d = value("[5, 3, 7].####");
  expect(d).toBeInstanceOf(FrameArray);
  // The host's whole Count is kept, three, not its parity (007.25c).
  expect(state(d)).toEqual(["3", "12", "3"]);
  expect(phase(d)).toEqual("1");
  expect(d.toText().toString()).toEqual("“Denum(3,12,3)”");
  // Its declared observers are the Denum laws; its own fourth hash is itself.
  expect(["#", "##", "###"].map((k) => `${d.sizeFor(k)}`))
    .toEqual(["3", "15", "9"]);
  expect(d.sizeFor("####").equals(d)).toBe(Frame.all);
  expect(d.sizeFor("####")).not.toBe(d);
});

Deno.test("the class is evaluated once, from the bundle, in a namespace of its own", () => {
  const first = denumClass();
  expect(first.className()).toEqual("FrameLazy");
  value("[1].####");
  expect(denumClass()).toBe(first);
  expect(HC_SOURCES.has(DENUM_SOURCE)).toBe(true);
  // A program's declarations cannot reach the class: the names the class
  // refuses with, and the names of its methods, stay its own.
  const answer = value(
    ".invalid-scale 7; .Denum 5; .phase 9; .count 8; [5, 3].####.scale_ (0 - 1)",
  );
  expect(answer.toString()).toContain("invalid-scale");
  expect(answer.toString()).not.toEqual("7");
  expect(state(value(".left 99; .count 8; [5, 3].####"))).toEqual([
    "2",
    "5",
    "3",
  ]);
});

Deno.test("loading failures are answered, never a fabricated class", () => {
  expect(loadDenumClass(undefined).toString()).toEqual(
    "$!.denum-prologue-missing hc/denum.hc",
  );
  expect(loadDenumClass(".Other {[]};").toString()).toEqual(
    "$!.denum-prologue-missing Denum",
  );
  // The class source has no root, so importing from it fails the load: this
  // is why denum.hc's own import is an example line.
  expect(loadDenumClass("X <- './hc/denum.hc';\n.Denum {[]};").toString())
    .toContain("$!.resource-import");
  // Example lines are dropped, as an import drops them.
  const fromExamples = loadDenumClass(
    "; .Denum 5;\n.Denum {[.phase _]};\n; Denum 1\n# 1\n",
  );
  expect(fromExamples.className()).toEqual("FrameLazy");
});

Deno.test("the constructor validates its three Counts in HC", () => {
  expect(state(constructDenum(count(2n), count(0n), count(0n))))
    .toEqual(["2", "0", "0"]);
  expect(
    state(constructDenum(count(1n), count(10n ** 30n), count(0n))),
  ).toEqual(["1", `${10n ** 30n}`, "0"]);
  // Any Count is a state, zero included, and the phase is read from its
  // parity: 2 when even, 1 when odd (007.25c). Nothing is refused by size.
  for (
    const [n, expected] of [
      [0n, "2"],
      [1n, "1"],
      [2n, "2"],
      [3n, "1"],
      [4n, "2"],
      [100n, "2"],
      [101n, "1"],
      [10n ** 30n, "2"],
    ] as const
  ) {
    const denum = constructDenum(count(n), count(5n), count(1n));
    expect(state(denum), `${n}`).toEqual([`${n}`, "5", "1"]);
    expect(phase(denum), `${n}`).toEqual(expected);
  }
  // What is not three Counts is refused: negative, fractional, short or long.
  const refused = (...elements: Frame[]) =>
    FrameExpr.answeredValue(
      (denumClass() as Frame).call(new FrameArray(elements)),
    ).referent().toString();
  for (
    const answer of [
      refused(new FrameInt(-1n), count(0n), count(0n)),
      refused(count(2n), new FrameInt(-1n), count(0n)),
      refused(count(2n), count(0n), new FrameDecimal("1.5")),
      refused(count(2n), count(1n)),
      refused(count(2n), count(1n), count(0n), count(0n)),
    ]
  ) {
    expect(answer).toContain("invalid-denum");
  }
});

Deno.test("equal phase and loads with different Counts are different Denums (007.25c)", () => {
  const two = constructDenum(count(2n), count(5n), count(1n));
  const four = constructDenum(count(4n), count(5n), count(1n));
  for (const key of ["phase", "left", "right"]) {
    expect(`${two.getOwn(key)}`).toEqual(`${four.getOwn(key)}`);
  }
  for (const key of ["#", "##", "###"].slice(1)) {
    expect(`${two.sizeFor(key)}`).toEqual(`${four.sizeFor(key)}`);
  }
  expect(`${two.sizeFor("#")}`).toEqual("2");
  expect(`${four.sizeFor("#")}`).toEqual("4");
  expect(two.equals(four)).toBe(Frame.nil);
  // The fourth hash keeps the Count it is given, so the two stay apart.
  expect(`${two.sizeFor("####").sizeFor("#")}`).toEqual("2");
  expect(`${four.sizeFor("####").sizeFor("#")}`).toEqual("4");
  expect(two.sizeFor("####").equals(four.sizeFor("####"))).toBe(Frame.nil);
  expect(four.sizeFor("####").equals(four)).toBe(Frame.all);
});

Deno.test("a Denum of Count zero is present, while an empty host has no Denum (007.25c)", () => {
  const zero = constructDenum(count(0n), count(0n), count(0n));
  // The three observers read 0, 0, 0 for it and for the empty host alike.
  const hosts: Frame[] = [new FrameArray([]), count(0n)];
  for (const host of hosts) {
    expect(host.sizeFor("#").toString()).toEqual("0");
    expect(host.sizeFor("###").toString()).toEqual("0");
    expect(host.sizeFor("####")).toBe(Frame.nil);
  }
  expect(["#", "##", "###"].map((k) => `${zero.sizeFor(k)}`))
    .toEqual(["0", "0", "0"]);
  // Only the class tells them apart, by declaring its own fourth hash.
  const same = zero.sizeFor("####");
  expect(same).not.toBe(Frame.nil);
  expect(same.equals(zero)).toBe(Frame.all);
  expect(same).not.toBe(zero);
  // A zero Count over nonzero loads is present too.
  const loaded = constructDenum(count(0n), count(3n), count(0n));
  expect(loaded.sizeFor("####").equals(loaded)).toBe(Frame.all);
  expect(state(loaded.sizeFor("####"))).toEqual(["0", "3", "0"]);
});

Deno.test("deposit observes the argument's Size once and propagates its failure", () => {
  const d = constructDenum(count(0n), count(0n), count(0n));
  expect(state(deposit(d, count(0n)))).toEqual(["1", "0", "0"]);
  expect(state(deposit(deposit(d, count(0n)), count(0n))))
    .toEqual(["2", "0", "0"]);
  expect(state(deposit(d, new FrameString("hello")))).toEqual(["1", "5", "0"]);
  // A cycle and a non-finite number have no Size: the failure is the answer,
  // and the Denum is unchanged.
  const cycle = new FrameArray([]);
  cycle.collect(cycle);
  expect(deposit(d, cycle).toString()).toEqual("$!.cyclic-aggregate .##");
  expect(deposit(d, new FrameNumber(Infinity)).toString()).toEqual(
    "$!.nonquantifiable-size .##",
  );
  expect(deposit(d, Frame.error("$!.stored")).toString()).toEqual("$!.stored");
  expect(state(d)).toEqual(["0", "0", "0"]);
  // An argument is never run to be measured.
  const counted: Frame[] = [];
  class Watched extends FrameArray {
    public override sizeFor(key: string): Frame {
      counted.push(new FrameString(key));
      return super.sizeFor(key);
    }
  }
  deposit(d, new Watched([count(4n)]));
  expect(counted.map(String)).toEqual(["“##”"]);
});

Deno.test("a Denum prints as HC that reads back as an equal Denum", () => {
  const d = value("[5, 3, 7].####");
  const printed = d.toString();
  expect(
    printed.startsWith(
      "[.count 3; .phase 1; .left 12; .right 3; .loads [12, 3]; .# {",
    ),
  ).toBe(true);
  const restored = value(printed);
  expect(state(restored)).toEqual(state(d));
  expect(restored.equals(d)).toBe(Frame.all);
  expect(restored.typeEquals(d)).toBe(Frame.all);
  expect(restored.identical(d)).toBe(Frame.nil);
  expect(value(`${printed} 4`).toText().toString()).toEqual(
    "“Denum(4,12,7)”",
  );
});

Deno.test("Denum equality is value equality of fields; identity is the aggregate's", () => {
  const a = constructDenum(count(1n), count(7n), count(2n));
  const b = constructDenum(count(1n), count(7n), count(2n));
  expect(a.equals(b)).toBe(Frame.all);
  expect(a.typeEquals(b)).toBe(Frame.all);
  expect(a.identical(b)).toBe(Frame.nil);
  expect(a.identical(a)).toBe(Frame.all);
  for (
    const other of [
      constructDenum(count(2n), count(7n), count(2n)),
      constructDenum(count(1n), count(8n), count(2n)),
      constructDenum(count(1n), count(7n), count(3n)),
      Frame.nil,
    ]
  ) {
    expect(a.equals(other)).toBe(Frame.nil);
  }
});

Deno.test("no operator is overloaded for a Denum; ordinary + and Star are unchanged", () => {
  const d = constructDenum(count(2n), count(1n), count(0n));
  expect(Add(d, count(2n))).toBe(Frame.nil);
  expect(Multiply(d, count(2n)).toString()).toEqual("$!.star-metadata *");
  // Count * Denum keeps the existing Star dispatch, which repeats it.
  const repeated = Multiply(count(2n), d) as FrameArray;
  expect(repeated.asArray()).toEqual([d, d]);
  expect(evaluate("2 + 3").at(0).toString()).toEqual("5");
  expect(evaluate("[5, 3] * 3").at(0).toString()).toEqual("[15, 9]");
  expect(evaluate("[] * [[], []]").at(0).toString()).toEqual("[[], []]");
});

Deno.test("arithmetic answers an error operand instead of nil (011.20)", () => {
  const missing = new FrameNote("!", "x");
  expect(missing.isError()).toBe(true);
  expect(Add(missing, count(1n))).toBe(missing);
  expect(Add(count(1n), missing)).toBe(missing);
  expect(Subtract(missing, count(1n))).toBe(missing);
  expect(Multiply(count(2n), missing)).toBe(missing);
  const stored = Frame.error("$!.stored");
  expect(Add(stored, missing)).toBe(stored);
  // A non-numeric pair is still nil, a non-finite number still a number, and
  // comparisons now preserve the same failure as arithmetic (#467).
  expect(Add(new FrameString("a"), count(1n))).toBe(Frame.nil);
  expect(Add(new FrameNumber(Infinity), count(1n)).toString())
    .toEqual("Infinity");
  expect(new FrameNumber(Infinity).isError()).toBe(false);
  expect(GreaterThan(missing, count(1n))).toBe(missing);
  expect(value("[].nope + 1").toString()).toContain("$!.name-missing");
});

Deno.test("a mutating method that answers a diagnostic error answers it, not its receiver", () => {
  expect(value(".o [.v 1; .m_ {nope}]; o.m_ 1").toString())
    .toContain("$!.name-missing");
  expect(value(".o [.v 1; .m_ {@v 2;}]; o.m_ 1").toString())
    .toEqual("[.v 2; .m_ { @v 2; };]");
});

Deno.test("an aggregate may declare its Count, Size and residual (011.20)", () => {
  const declared = value(
    "[.l 12; .r 3; .# {1}; .## {_^.l + _^.r}; .### {_^.l - _^.r}]",
  );
  expect(["#", "##", "###"].map((k) => `${declared.sizeFor(k)}`))
    .toEqual(["1", "15", "9"]);
  // Nested, it contributes its declared Size.
  expect(new FrameArray([declared, declared]).sizeFor("##").toString())
    .toEqual("30");
  // Through a handle, the same.
  expect(new FrameHandle(declared, false).sizeFor("##").toString())
    .toEqual("15");
  for (
    const [source, answer] of [
      ["[.## {“x”}].##", "$!.declared-observation .##"],
      ["[.# {0 - 1}].#", "$!.declared-observation .#"],
      ["[.### {1.5}].###", "$!.declared-observation .###"],
      ["[.## {_^.##}].##", "$!.cyclic-observation .##"],
      ["[.### {0 - 2}].###", "-2"],
      ["[.x 1].##", "1"],
      ["[5, 3].##", "8"],
    ]
  ) {
    expect(value(source).toString(), source).toEqual(answer);
  }
  expect(value("[.## {[].nope}].##").toString()).toContain("$!.name-missing");
  // No class declares `####` (007.25e): a method under that name is an
  // ordinary property the fourth hash never runs, so it is derived as usual.
  expect(value("[.#### {7}; 5, 3].####").toText().toString())
    .toEqual("“Denum(2,5,3)”");
  expect(value("[.#### {[]}; 5, 3].####").toText().toString())
    .toEqual("“Denum(2,5,3)”");
  expect(value("[.#### {()}; 5, 3].#### = [5, 3].####").toString())
    .toEqual("<>");
  expect(value("([.#### {[].nope}].####) = ()").toString()).toEqual("<>");
  expect(value("([.#### {_^.####}].####) = ()").toString()).toEqual("<>");
  expect(
    value(
      "([.# {0}; .## {0}; .### {0}; .#### {[.# {0}; .## {0}; .### {0}]}].####) = ()",
    ).toString(),
  ).toEqual("<>");
});

Deno.test("only an instance of the shipped Denum class takes the intrinsic fourth-hash path (007.25e)", () => {
  const zero = constructDenum(count(0n), count(0n), count(0n));
  const answer = zero.sizeFor(Frame.kDENUM);
  // Present, equal, fresh: a reconstruction, never the source itself.
  expect(answer).not.toBe(Frame.nil);
  expect(answer).not.toBe(zero);
  expect(answer.typeEquals(zero)).toBe(Frame.all);
  expect(state(answer)).toEqual(["0", "0", "0"]);
  // Through an immutable handle, the same.
  expect(new FrameHandle(zero, false).sizeFor(Frame.kDENUM).typeEquals(zero))
    .toBe(Frame.all);
  // A zero-Count Denum over nonzero loads, reached without application.
  const loaded = constructDenum(count(0n), count(3n), count(4n));
  expect(state(loaded.sizeFor(Frame.kDENUM))).toEqual(["0", "3", "4"]);

  // Foreign aggregates: forged observers, Denum-named fields with the wrong
  // phase, the wrong types, or an extra field are not Denums. With Count zero
  // they have no fourth hash; nothing of theirs runs.
  for (
    const source of [
      "[.# {0}; .## {0}; .### {0}]",
      "[.count 0; .phase 2; .left 0; .right 0]",
      "[.count 0; .phase 1; .left 0; .right 0; .# {_^ .count}; .## {_^ .left + _^ .right}; .### {_^ .left - _^ .right}]",
      "[.count 0.0; .phase 2; .left 0; .right 0]",
      "[.count “0”; .phase 2; .left 0; .right 0]",
      "[.extra 1; .count 0; .phase 2; .left 0; .right 0]",
    ]
  ) {
    expect(value(`(${source}.####) = ()`).toString(), source).toEqual("<>");
  }
  expect(
    value(
      ".n_ [.v 0; .b_ {@v 1;}]; .f [.count 0; .left 0; .right 0; .#### {n_.b_ (); 7}]; f.####; n_.v",
    ).toString(),
  ).toEqual("0");
  // A Denum edited by a foreign copy with one method changed is foreign too:
  // it falls back to the derived path, here its declared observers.
  const edited = constructDenum(count(2n), count(5n), count(3n)) as FrameArray;
  const forged = new FrameArray([]);
  for (const key of edited.visibleKeys()) {
    forged.set(
      key,
      key === "toText" ? new FrameString("forged") : edited.get_here(key),
    );
  }
  expect(forged.typeEquals(edited)).toBe(Frame.nil);
  const derived = forged.sizeFor(Frame.kDENUM);
  expect(derived).not.toBe(forged);
  expect(derived.typeEquals(edited)).toBe(Frame.all);
});

Deno.test("declared observations terminate on every recursion and report their effects (review of #466)", () => {
  // Through the same receiver, directly or across keys or objects: cyclic.
  expect(value(".a [.## {b.##}]; .b [.## {a.##}]; [a.##, b.##]").toString())
    .toEqual("[$!.cyclic-observation .##, $!.cyclic-observation .##]");
  expect(value(".c [.# {_^.##}; .## {_^.#}]; [c.#, c.##]").toString())
    .toEqual("[$!.cyclic-observation .#, $!.cyclic-observation .##]");
  // Through a fresh receiver each step: bounded, not a stack overflow.
  expect(value(".Mk {[.## {(Mk ()).##}]}; (Mk ()).##").toString())
    .toEqual("$!.observation-depth .##");
  // The bound is released after a failure, so later observations still run.
  expect(value(".Mk {[.## {(Mk ()).##}]}; (Mk ()).##; [.## {4}].##").toString())
    .toEqual("4");
  // Legitimate nesting well inside the bound is answered.
  expect(
    value(
      ".In {[.v _; .## {_^.v.##}]}; (In (In (In (In (In [1, 2]))))).##",
    ).toString(),
  ).toEqual("3");
});

Deno.test("a declared observer runs on every observation, cannot write its receiver, and may act elsewhere", () => {
  // No caching: each observation runs the method again. `.####` reads each of
  // the three declared observers exactly once.
  const runs = value(
    ".counter_ [.n 0; .inc_ {@n (_^.n + 1);}];" +
      " .k [.# {counter_.inc_ (); 1}; .## {counter_.inc_ (); 5}; .### {counter_.inc_ (); 1}];" +
      " k.##; k.##; k.####; counter_.n",
  );
  expect(runs.toString()).toEqual("5");
  // The receiver is read-only to its observer; a write is refused and lands
  // nowhere.
  expect(value(".w [.v 1; .## {@v 9; 3}]; [w.##, w.v]").toString())
    .toEqual("[$!.method-not-mutating @v, 1]");
});

Deno.test("failures of declared observations propagate through the fourth hash and application", () => {
  expect(
    value(".q [.# {1}; .## {2}; .### {[].nope}]; q.####").toString(),
  ).toContain("$!.name-missing");
  // A Denum applied to a Frame whose declared Size fails answers that failure.
  expect(
    value(".bad [.## {[].nope}]; [5, 3].#### bad").toString(),
  ).toContain("$!.name-missing");
  expect(
    value(".bad [.## {“x”}]; [5, 3].#### bad").toString(),
  ).toEqual("$!.declared-observation .##");
});

/** The printed text of the value a bare source answers. */
const text = (source: string): string => value(source).toText().toString();

Deno.test("Count binding .#% runs in a bare evaluator with no root or import (007.40)", () => {
  // The bound Denum is built by the bundled class, reached through .####.
  expect(text("[2, 5].####.#%")).toEqual("“Denum(2,2,5)”");
  expect(text("[5, 3, 7].####.#%")).toEqual("“Denum(3,[12, 3, 0])”");
  const bound = value("[5, 3, 7].####.#%");
  expect(bound.getOwn("count").toString()).toEqual("3");
  expect(`${bound.getOwn("loads")}`).toEqual("[12, 3, 0]");
  // Only a Denum is bound; the empty host has no Denum to bind.
  expect(value("[5, 3].#%").toString()).toEqual("$!.denum-binding-receiver");
  expect(value("[].####.#%").toString()).toEqual("$!.denum-binding-receiver");
  expect(value("().#%").toString()).toEqual("$!.denum-binding-receiver");
});

Deno.test("the bound Denum is the fourth hash's own and its receiver is unchanged (007.40)", () => {
  const source = value("[5, 3, 7].####");
  const before = `${source.getOwn("loads")}`;
  const bound = source.sizeFor(Frame.kBIND);
  expect(`${source.getOwn("loads")}`).toEqual(before);
  // The answer is a recognized Denum: .#### reconstructs it, and binding again
  // changes nothing.
  expect(bound.sizeFor(Frame.kDENUM).equals(bound)).toBe(Frame.all);
  expect(bound.sizeFor(Frame.kBIND).equals(bound)).toBe(Frame.all);
});

Deno.test("a forged Denum is refused by .#% without running anything (007.40)", () => {
  expect(
    value("[.count 3; .loads [1, 2]; .# {3}; .## {3}; .### {1}].#%")
      .toString(),
  ).toEqual("$!.denum-binding-receiver");
  // A class cannot declare .#% for itself: the method is never run.
  expect(value("[.#% {[5, 3].####}].#%").toString()).toEqual(
    "$!.denum-binding-receiver",
  );
});
