import { expect } from "jsr:@std/expect@^0.219.1";
import {
  Frame,
  FrameArray,
  FrameCount,
  FrameExpr,
  FrameNote,
  FrameNumber,
  FrameString,
} from "../frames.ts";
import { FrameHandle } from "../frames/frame-handle.ts";
import { HC_SOURCES } from "../bundle/hc-sources.ts";
import { Add, GreaterThan, Multiply, Subtract } from "../ops/math.ts";
import { evaluate } from "./evaluate.ts";
import {
  constructDemi,
  DEMI_SOURCE,
  demiClass,
  loadDemiClass,
} from "./demi-prologue.ts";

const count = (n: bigint): FrameCount => new FrameCount(n);

/**
 * The value a source's last statement answers, unwrapped. A source of several
 * statements answers a group of them; an aggregate, a Demi included, answers
 * itself.
 */
const value = (source: string): Frame => {
  let answer = FrameExpr.answeredValue(evaluate(source).at(-1)).referent();
  while (!(answer instanceof FrameArray) && answer.asArray().length > 1) {
    answer = FrameExpr.answeredValue(answer.asArray().at(-1)!).referent();
  }
  return answer;
};

/** A Demi's phase and loads, read from the fields of the HC instance. */
const state = (demi: Frame): string[] =>
  ["phase", "left", "right"].map((key) => `${demi.getOwn(key)}`);

/** `d x` through an immutable name, as HC applies a named Demi. */
const deposit = (d: Frame, x: Frame): Frame =>
  FrameExpr.answeredValue(new FrameHandle(d, false).call(x)).referent();

Deno.test("the fourth hash constructs the HC class in a bare evaluator with no root", () => {
  // A bare evaluate has no root, so it can import nothing, bundled or not.
  expect(evaluate("X <- './hc/demi.hc'; X").toString()).toContain("$!");
  // Yet .#### answers an instance of the class in hc/demi.hc.
  const d = value("[5, 3, 7].####");
  expect(d).toBeInstanceOf(FrameArray);
  expect(state(d)).toEqual(["1", "12", "3"]);
  expect(d.toText().toString()).toEqual("“Demi((),12,3)”");
  // Its declared observers are the Demi laws; its own fourth hash is itself.
  expect(["#", "##", "###"].map((k) => `${d.sizeFor(k)}`))
    .toEqual(["1", "15", "9"]);
  expect(d.sizeFor("####").equals(d)).toBe(Frame.all);
  expect(d.sizeFor("####")).not.toBe(d);
});

Deno.test("the class is evaluated once, from the bundle, in a namespace of its own", () => {
  const first = demiClass();
  expect(first.className()).toEqual("FrameLazy");
  value("[1].####");
  expect(demiClass()).toBe(first);
  expect(HC_SOURCES.has(DEMI_SOURCE)).toBe(true);
  // A program's declarations cannot reach the class: the names the class
  // refuses with, and the names of its methods, stay its own.
  const answer = value(
    ".invalid-scale 7; .Demi 5; .phase 9; [5, 3].####.scale_ (0 - 1)",
  );
  expect(answer.toString()).toContain("invalid-scale");
  expect(answer.toString()).not.toEqual("7");
  expect(state(value(".left 99; [5, 3].####"))).toEqual(["2", "5", "3"]);
});

Deno.test("loading failures are answered, never a fabricated class", () => {
  expect(loadDemiClass(undefined).toString()).toEqual(
    "$!.demi-prologue-missing hc/demi.hc",
  );
  expect(loadDemiClass(".Other {[]};").toString()).toEqual(
    "$!.demi-prologue-missing Demi",
  );
  // The class source has no root, so importing from it fails the load: this
  // is why demi.hc's own import is an example line.
  expect(loadDemiClass("X <- './hc/demi.hc';\n.Demi {[]};").toString())
    .toContain("$!.resource-import");
  // Example lines are dropped, as an import drops them.
  const fromExamples = loadDemiClass(
    "; .Demi 5;\n.Demi {[.phase _]};\n; Demi 1\n# 1\n",
  );
  expect(fromExamples.className()).toEqual("FrameLazy");
});

Deno.test("the constructor validates its three Counts in HC", () => {
  expect(state(constructDemi(count(2n), count(0n), count(0n))))
    .toEqual(["2", "0", "0"]);
  expect(
    state(constructDemi(count(1n), count(10n ** 30n), count(0n))),
  ).toEqual(["1", `${10n ** 30n}`, "0"]);
  for (const phase of [0n, 3n]) {
    expect(constructDemi(count(phase), count(0n), count(0n)).toString())
      .toContain("invalid-demi");
  }
});

Deno.test("deposit observes the argument's Size once and propagates its failure", () => {
  const d = constructDemi(count(2n), count(0n), count(0n));
  expect(state(deposit(d, count(0n)))).toEqual(["1", "0", "0"]);
  expect(state(deposit(deposit(d, count(0n)), count(0n))))
    .toEqual(["2", "0", "0"]);
  expect(state(deposit(d, new FrameString("hello")))).toEqual(["1", "5", "0"]);
  // A cycle and a non-finite number have no Size: the failure is the answer,
  // and the Demi is unchanged.
  const cycle = new FrameArray([]);
  cycle.collect(cycle);
  expect(deposit(d, cycle).toString()).toEqual("$!.cyclic-aggregate .##");
  expect(deposit(d, new FrameNumber(Infinity)).toString()).toEqual(
    "$!.nonquantifiable-size .##",
  );
  expect(deposit(d, Frame.error("$!.stored")).toString()).toEqual("$!.stored");
  expect(state(d)).toEqual(["2", "0", "0"]);
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

Deno.test("a Demi prints as HC that reads back as an equal Demi", () => {
  const d = value("[5, 3, 7].####");
  const printed = d.toString();
  expect(printed.startsWith("[.phase 1; .left 12; .right 3; .# {")).toBe(true);
  const restored = value(printed);
  expect(state(restored)).toEqual(state(d));
  expect(restored.equals(d)).toBe(Frame.all);
  expect(restored.typeEquals(d)).toBe(Frame.all);
  expect(restored.identical(d)).toBe(Frame.nil);
  expect(value(`${printed} 4`).toText().toString()).toEqual(
    "“Demi(<>,12,7)”",
  );
});

Deno.test("Demi equality is value equality of fields; identity is the aggregate's", () => {
  const a = constructDemi(count(1n), count(7n), count(2n));
  const b = constructDemi(count(1n), count(7n), count(2n));
  expect(a.equals(b)).toBe(Frame.all);
  expect(a.typeEquals(b)).toBe(Frame.all);
  expect(a.identical(b)).toBe(Frame.nil);
  expect(a.identical(a)).toBe(Frame.all);
  for (
    const other of [
      constructDemi(count(2n), count(7n), count(2n)),
      constructDemi(count(1n), count(8n), count(2n)),
      constructDemi(count(1n), count(7n), count(3n)),
      Frame.nil,
    ]
  ) {
    expect(a.equals(other)).toBe(Frame.nil);
  }
});

Deno.test("no operator is overloaded for a Demi; ordinary + and Star are unchanged", () => {
  const d = constructDemi(count(2n), count(1n), count(0n));
  expect(Add(d, count(2n))).toBe(Frame.nil);
  expect(Multiply(d, count(2n)).toString()).toEqual("$!.star-metadata *");
  // Count * Demi keeps the existing Star dispatch, which repeats it.
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
  // ordering still answers nil, since an error would be truthy under `?`.
  expect(Add(new FrameString("a"), count(1n))).toBe(Frame.nil);
  expect(Add(new FrameNumber(Infinity), count(1n)).toString())
    .toEqual("Infinity");
  expect(new FrameNumber(Infinity).isError()).toBe(false);
  expect(GreaterThan(missing, count(1n))).toBe(Frame.nil);
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
  // `####` is not declarable; it is always derived.
  expect(value("[.#### {7}; 5, 3].#### = [5, 3].####").toString())
    .toEqual("<>");
});
