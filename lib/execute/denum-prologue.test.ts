import { expect } from "jsr:@std/expect@^0.219.1";
import {
  denum,
  EvaluationScope,
  Frame,
  FrameArray,
  FrameCount,
  FrameExpr,
} from "../frames.ts";
import { evaluateSourceText } from "./resource-import.ts";
import { HC_SOURCES } from "../bundle/hc-sources.ts";
import { DENUM_OPERATIONS, DenumEngine } from "../ops/denum.ts";
import { evaluate } from "./evaluate.ts";
import {
  constructCD,
  constructDenum,
  DENUM_SOURCE,
  denumClasses,
  loadDenumClasses,
} from "./denum-prologue.ts";

/** The value a source's last statement answers, unwrapped. */
const value = (source: string): Frame => {
  let answer = FrameExpr.answeredValue(evaluate(source).at(-1)).referent();
  while (!(answer instanceof FrameArray) && answer.asArray().length > 1) {
    answer = FrameExpr.answeredValue(answer.asArray().at(-1)!).referent();
  }
  return answer;
};

const text = (source: string): string => `${value(source)}`;

/** A Denum instance's Count and loads, read from its HC fields. */
const state = (instance: Frame): string =>
  `${instance.getOwn("count")}|${instance.getOwn("loads")}`;

const counts = (...values: number[]): FrameArray =>
  new FrameArray(values.map((n) => new FrameCount(BigInt(n))));

Deno.test("the ranked hash constructs the HC class in a bare evaluator", () => {
  expect(evaluate("X <- './hc/denum.hc'; X").toString()).toContain("$!");
  const d = value("[1, 2, 3].#2");
  expect(d).toBeInstanceOf(FrameArray);
  expect(state(d)).toEqual("3|[4, 0, 2, 0]");
  expect(d.toText().toString()).toEqual("“CD[2](C=3, W=[4, 0, 2, 0])”");
});

Deno.test("each rank answers the Denum of that rung, with no #n= form", () => {
  const ranks = [0, 1, 2, 3, 4, 5];
  const widths = ranks.map((n) =>
    (value(`[1, 2, 3].#${n}`).getOwn("loads") as FrameArray).elements().length
  );
  expect(widths).toEqual([1, 2, 4, 8, 16, 32]);
  for (const n of ranks) {
    const d = `[1, 2, 3].#${n}`;
    expect(text(`${d}.schema ()`)).toEqual(`“CD[${n}]”`);
    expect(text(`${d}.rank ()`)).toEqual(`${n}`);
    // Derived on demand: neither is stored data.
    // `rank` and `schema` are methods (code), not Count or text data.
    expect(value(d).getOwn("rank")).not.toBeInstanceOf(FrameCount);
    expect(`${value(d).getOwn("rank")}`).toContain("denum-engine");
    expect(`${value(d).getOwn("schema")}`).toContain("denum-engine");
  }
});

Deno.test("bare .# stays the Count and the fixed hashes are unchanged", () => {
  expect(text("[1, 2, 3].#")).toEqual("3");
  expect(text("[1, 2, 3].##")).toEqual("6");
  expect(text("[1, 2, 3].###")).toEqual("2");
  const demi = value("[1, 2, 3].####");
  expect(
    `${demi.getOwn("count")}|${demi.getOwn("left")}|${demi.getOwn("right")}`,
  )
    .toEqual("3|4|2");
  // `.#1` carries the Demi's Count and left and right loads exactly.
  expect(state(value("[1, 2, 3].#1"))).toEqual("3|[4, 2]");
});

Deno.test("a host with no Count, or Count zero, has no Denum", () => {
  // A statement that answers nil leaves the evaluator's group empty.
  for (const source of ["[].#0", "[].#1", "[].#5", "().#2", "0.#3"]) {
    expect(`${evaluate(source)}`).toEqual("[]");
  }
  expect(`${evaluate("[0].#0")}`).not.toEqual("[]");
});

Deno.test("rank above five and failed hosts are named errors", () => {
  expect(text("[1].#6")).toEqual("$!.denum-rank");
  expect(text("[1].#99")).toEqual("$!.denum-rank");
  expect(text("[1].nope.#2")).toContain("$!.");
});

Deno.test("a Denum answers the ranked hash by promotion, never demotion", () => {
  // Count 2, Size 6 and residual 4 give the loads 5 and 1.
  expect(state(value("[5, 1].#1"))).toEqual("2|[5, 1]");
  expect(state(value("[5, 1].#1.#3"))).toEqual("2|[5, 0, 0, 0, 1, 0, 0, 0]");
  expect(text("[5, 1].#3.#1")).toEqual("$!.denum-demotion");
  // Count zero is present for an instance, unlike a childless host.
  const zero = constructCD(denum.cd(0n, [3n, 1n]));
  expect(state(zero)).toEqual("0|[3, 1]");
  expect(zero.sizeFor("#3")).toBeInstanceOf(FrameArray);
  expect(state(zero.sizeFor("#3"))).toEqual("0|[3, 0, 0, 0, 1, 0, 0, 0]");
});

Deno.test("a forged lookalike is measured like any host, not recognized", () => {
  const fake = value(
    "[.count 9; .loads [3, 1]; .# {99}; .## {99}; .### {99}].#1",
  );
  expect(state(fake)).toEqual("99|[99, 0]");
});

Deno.test("the class loads once, and a missing source is a named error", () => {
  expect(denumClasses()).toBe(denumClasses());
  expect(`${loadDenumClasses(undefined)}`).toContain(
    "$!.denum-prologue-missing",
  );
  expect(HC_SOURCES.get(DENUM_SOURCE)).toBeDefined();
  expect((loadDenumClasses("this is not hc (") as Frame).isFailedResult())
    .toBe(true);
  // A file that declares only one of the two constructors is not accepted.
  expect(`${loadDenumClasses(".Denum {_};")}`).toContain(
    "$!.denum-prologue-missing CD",
  );
  expect(`${loadDenumClasses(".CD {_};")}`).toContain(
    "$!.denum-prologue-missing Denum",
  );
  const classes = denumClasses() as { denum: Frame; cd: Frame };
  expect(classes.denum).toBeInstanceOf(Frame);
  expect(classes.cd).toBeInstanceOf(Frame);
  expect(classes.denum).not.toBe(classes.cd);
});

Deno.test("denum-engine refuses malformed requests with named errors", () => {
  const call = (...args: Frame[]): string =>
    `${DenumEngine(Frame.nil, new FrameArray(args))}`;
  const n = (v: number): FrameCount => new FrameCount(BigInt(v));
  expect(call()).toEqual("$!!.invalid-denum");
  expect(call(n(99), n(0), counts(0, 0))).toEqual("$!!.invalid-denum");
  expect(call(n(0), n(0), counts(0))).toEqual("[0, [0]]");
  expect(call(n(0), n(9), counts(0))).toEqual("[9, [0]]");
  expect(call(n(0), n(0), counts(0, 0))).toEqual("[0, [0, 0]]");
  // An empty load list and a bare Count for the loads are refused.
  expect(call(n(0), n(0), counts())).toEqual("$!!.invalid-denum");
  expect(call(n(0), n(0), n(0))).toEqual("$!!.invalid-denum");
  expect(call(n(6), n(0), counts(0, 0, 0, 0), n(1))).toEqual(
    "$!.denum-demotion",
  );
  expect(call(n(6), n(0), counts(0, 0), n(7))).toEqual("$!.denum-rank");
  // A binary operation without its right operand is refused, not defaulted.
  expect(call(n(3), n(0), counts(0, 1))).toEqual("$!!.invalid-denum");
  // Rank mismatch is promotion, not an error.
  expect(
    call(n(3), n(1), counts(0, 1), n(1), counts(0, 1, 0, 0)),
  ).toEqual("[1, [0, 0, 0, 1]]");
});

Deno.test("denum-engine answers a two-field state and refuses legacy rank payloads", () => {
  const call = (...args: Frame[]): string =>
    `${DenumEngine(Frame.nil, new FrameArray(args))}`;
  const n = (v: number): FrameCount => new FrameCount(BigInt(v));
  const ops = { build: 0, add: 1, opposite: 4, schema: 9, rank: 11 };
  // Legacy shape [op, rank, count, loads]: the loads slot is read as a Count.
  for (const op of Object.values(ops)) {
    expect(call(n(op), n(1), n(3), counts(4, 2))).toEqual("$!!.invalid-denum");
  }
  expect(call(n(ops.add), n(1), n(3), counts(4, 2), n(1), n(3), counts(4, 2)))
    .toEqual("$!!.invalid-denum");
  // The current shape answers [count, loads], with no rank in the answer.
  expect(call(n(ops.build), n(3), counts(4, 2))).toEqual("[3, [4, 2]]");
  expect(call(n(ops.opposite), n(3), counts(4, 2))).toEqual("[3, [2, 4]]");
  // Rank is an observation of the loads, never of the Count.
  const rank = (count: number, ...loads: number[]) =>
    call(n(ops.rank), n(count), counts(...loads));
  expect(rank(0, 1)).toEqual("0");
  expect(rank(0, 1, 1)).toEqual("1");
  expect(rank(0, 1, 1, 1)).toEqual("1");
  expect(rank(1000, 1, 1, 1, 1, 1)).toEqual("2");
  expect(rank(1, ...Array(33).fill(0))).toEqual("5");
  expect(rank(1, ...Array(64).fill(0))).toEqual("6");
  // The CD schema is CD-only; the generic schema never claims a CD rung, even
  // at a power-of-two arity.
  const denumSchema = DENUM_OPERATIONS.denumSchema;
  expect(call(n(denumSchema), n(0), counts(1, 2, 3))).toEqual("“Arity[3]”");
  expect(call(n(denumSchema), n(0), counts(1, 2, 3, 4))).toEqual("“Arity[4]”");
  expect(call(n(ops.schema), n(0), counts(1, 2, 3, 4))).toEqual("“CD[2]”");
  expect(call(n(ops.schema), n(0), counts(1, 2, 3))).toEqual(
    "$!.denum-unsupported-arity",
  );
  // CD-only operations refuse a non-CD arity, rather than guess.
  for (const op of [4, 5, 7, 8, 10, 14]) {
    expect(call(n(op), n(0), counts(1, 2, 3))).toEqual(
      "$!.denum-unsupported-arity",
    );
  }
  expect(call(n(6), n(0), counts(1, 2, 3), n(2))).toEqual(
    "$!.denum-unsupported-arity",
  );
  expect(call(n(1), n(0), counts(1, 2, 3), n(0), counts(1, 2, 3))).toEqual(
    "$!.denum-unsupported-arity",
  );
});

Deno.test("coordinates: nil is signed, true is unsigned, native not truthiness", () => {
  // Instances come from the ranked hash: this bare evaluator cannot import the
  // class file, and the exact loads are pinned by the testdocs in hc/denum.hc.
  const opposed = "(([1, 2, 3].#2).opp ())";
  expect(text("[1, 2, 3].#1.coordinates ()")).toEqual("[2]");
  expect(text("[1, 2, 3].#1.coordinates <>")).toEqual("[6]");
  expect(text("[1, 2, 3].#1.observe ()")).toEqual("[2]");
  expect(text(`${opposed}.loads`)).toEqual("[2, 0, 4, 0]");
  expect(text(`${opposed}.coordinates ()`)).toEqual("[-2, 0]");
  expect(text(`${opposed}.coordinates <>`)).toEqual("[6, 0]");
  expect(text(`${opposed}.count`)).toEqual("3");
  // D0 answers [W] in both modes.
  expect(text("[1, 2, 3].#0.coordinates ()")).toEqual("[6]");
  expect(text("[1, 2, 3].#0.coordinates <>")).toEqual("[6]");
  expect(text("[1, 2, 3].#5.coordinates <>").split(",").length).toBe(16);
  for (const bad of ["1", "0", "“x”", "[1]", "[]", "{1}"]) {
    expect(text(`[1, 2, 3].#2.coordinates ${bad}`)).toEqual(
      "$!!.unary-observation",
    );
  }
  expect(text("[1, 2, 3].#2.observe <>")).toEqual("$!!.unary-observation");
});

Deno.test("denum-engine coordinates mode is exactly 0, 1 or absent", () => {
  const call = (...args: Frame[]): string =>
    `${DenumEngine(Frame.nil, new FrameArray(args))}`;
  const n = (v: number): FrameCount => new FrameCount(BigInt(v));
  const state = [n(7), n(1), counts(3, 2, 1, 4)];
  expect(call(...state)).toEqual("[2, -2]");
  expect(call(...state, n(0))).toEqual("[2, -2]");
  expect(call(...state, n(1))).toEqual("[4, 6]");
  expect(call(...state, n(2))).toEqual("$!!.invalid-denum");
  expect(call(...state, new FrameArray([]))).toEqual("$!!.invalid-denum");
});

Deno.test("coordinates agree with the HC observers d.## and d.### on ranks 0 to 5", () => {
  const sum = (list: string): bigint =>
    list.replace(/[[\]\s]/g, "").split(",").reduce((a, v) => a + BigInt(v), 0n);
  let checked = 0;
  // Hosts of several shapes; `.opp ()` and `+` give balanced and empty-ish states.
  for (const host of ["[1, 2, 3]", "[4, 4, 4, 4]", "[5]", "[2, 0]"]) {
    for (let rank = 0; rank <= 5; rank++) {
      const d = `(${host}.#${rank})`;
      const read = (expression: string): string => text(`${d}${expression}`);
      const states = [
        d,
        `(${d} + (${d}.opp ()))`, // present and balanced, never empty
        `(${d} * ${d})`,
      ];
      for (const s of states) {
        if (text(`${s}.rank ()`) === "()") continue;
        const size = BigInt(text(`${s}.##`));
        const residual = BigInt(text(`${s}.###`));
        const unsigned = text(`${s}.coordinates <>`);
        const signed = text(`${s}.coordinates ()`);
        // Σ U = d.## at every rank, Σ S = d.### from rank 1.
        expect(sum(unsigned)).toBe(size);
        checked++;
        if (s === d && rank === 0) {
          expect(sum(signed)).toBe(size);
          expect(residual).toBe(0n);
        } else if (text(`${s}.rank ()`) === "0") {
          expect(residual).toBe(0n);
        } else {
          expect(sum(signed)).toBe(residual);
        }
      }
      expect(read(".coordinates ()")).toEqual(read(".observe ()"));
    }
  }
  // The loop is not vacuous: most host/rank/state combinations are Denums.
  expect(checked).toBeGreaterThan(40);
  // Zero and positive Count over the same loads, and the D0 exception by name.
  expect(text("[0, 0, 0].#0.coordinates ()")).toEqual("[0]");
  expect(text("[1, 2, 3].#0.##")).toEqual("6");
  expect(text("[1, 2, 3].#0.###")).toEqual("0");
  expect(text("[1, 2, 3].#1.###")).toEqual("2");
});

Deno.test("the HC class refuses the legacy constructor and spoofed operands", () => {
  // Under a bare evaluator the class is reached through the ranked hash.
  const d = "([5, 1].#1)";
  expect(text(`${d}.rank ()`)).toEqual("1");
  expect(text(`${d}.rank 1`)).toEqual("$!!.unary-observation");
  expect(text(`${d} + [.count 2; .loads [5, 1]]`)).toEqual("$!!.invalid-denum");
  expect(text(`“” (${d} + ([5, 1].#1))`)).toContain("CD[1](");
});

Deno.test("a generic Denum keeps its loads and is never a source for .#n", () => {
  // Odd, binary and shipped-CD arities alike: the arity decides nothing.
  for (const loads of [[3n, 2n, 1n], [5n], [3n, 1n], [3n, 2n, 1n, 4n]]) {
    const generic = constructDenum(denum.denum(7n, loads));
    const before = state(generic);
    for (const rank of [0, 1, 2, 3, 5]) {
      expect(`${generic.sizeFor(`#${rank}`)}`).toEqual("$!.denum-not-cd");
    }
    expect(`${generic.sizeFor("#6")}`).toEqual("$!.denum-rank");
    // The source is untouched and still the same generic type.
    expect(state(generic)).toEqual(before);
    expect(`${generic.toText()}`).toContain(`Denum(Arity[${loads.length}]`);
  }
  const three = constructDenum(denum.denum(7n, [3n, 2n, 1n]));
  expect(state(three)).toEqual("7|[3, 2, 1]");
  expect(`${three.toText()}`).toEqual("“Denum(Arity[3], C=7, W=[3, 2, 1])”");
  // The same data through the explicit CD constructor is a CD and promotes.
  const four = denum.cd(7n, [3n, 2n, 1n, 4n]);
  expect(state(constructCD(four).sizeFor("#3"))).toEqual(
    "7|[3, 2, 0, 0, 1, 4, 0, 0]",
  );
  // A non-CD arity cannot be built as a CD at all.
  expect(`${constructCD({ count: 7n, loads: [3n, 2n, 1n] })}`).toEqual(
    "$!.denum-unsupported-arity",
  );
});

Deno.test("the HC constructors are two types: Denum is generic, CD is explicit", () => {
  const cd = (loads: string) =>
    `(([1, 2, 3].#2) + ([1, 2, 3].#2)).loads = ${loads}`;
  expect(text(cd("[8, 0, 4, 0]"))).toEqual("<>");
  const g = constructDenum(denum.denum(7n, [3n, 2n, 1n, 4n]));
  const c = constructCD(denum.cd(7n, [3n, 2n, 1n, 4n]));
  expect(`${g.getOwn("schema")}`).toContain("denum-engine [13");
  expect(`${c.getOwn("schema")}`).toContain("denum-engine [9");
  expect(`${g.getOwn("count")}|${g.getOwn("loads")}`).toEqual(
    `${c.getOwn("count")}|${c.getOwn("loads")}`,
  );
  // The generic type defines no CD algebra at all, and neither type has a
  // conversion method.
  for (const name of ["asCD", "cd", "fromDenum", "toCD", "toDenum"]) {
    expect(g.getOwn(name).is.missing).toBe(true);
    expect(c.getOwn(name).is.missing).toBe(true);
  }
  // Types differ: an instance equals only a same-type rebuild.
  expect(g.typeEquals(c)).not.toBe(Frame.all);
  expect(c.typeEquals(g)).not.toBe(Frame.all);
  expect(g.typeEquals(constructDenum(denum.denum(7n, [3n, 2n, 1n, 4n]))))
    .toBe(Frame.all);
  expect(c.typeEquals(constructCD(denum.cd(7n, [3n, 2n, 1n, 4n])))).toBe(
    Frame.all,
  );
});

Deno.test("denum-engine: generic ops take any arity, CD ops need a CD arity", () => {
  const call = (...args: Frame[]): string =>
    `${DenumEngine(Frame.nil, new FrameArray(args))}`;
  const n = (v: number): FrameCount => new FrameCount(BigInt(v));
  const ops = DENUM_OPERATIONS;
  // Generic equal-arity addition: componentwise, Counts add.
  expect(call(n(ops.addDenum), n(7), counts(3, 2, 1), n(2), counts(4, 0, 0)))
    .toEqual("[9, [7, 2, 1]]");
  expect(
    call(n(ops.addDenum), n(7), counts(3, 2, 1, 4), n(2), counts(4, 0, 0, 5)),
  ).toEqual("[9, [7, 2, 1, 9]]");
  expect(call(n(ops.addDenum), n(7), counts(3, 2, 1), n(2), counts(4, 0, 0, 5)))
    .toEqual("$!.denum-arity-mismatch");
  expect(call(n(ops.addDenum), n(7), counts(3, 2, 1)))
    .toEqual("$!!.invalid-denum");
  // Building: generic accepts everything positive; CD only the shipped arities.
  expect(call(n(ops.build), n(0), counts(0, 0, 0))).toEqual("[0, [0, 0, 0]]");
  expect(call(n(ops.buildCD), n(0), counts(0, 0, 0))).toEqual(
    "$!.denum-unsupported-arity",
  );
  expect(call(n(ops.buildCD), n(0), counts(0, 0, 0, 0))).toEqual(
    "[0, [0, 0, 0, 0]]",
  );
  expect(call(n(ops.buildCD), n(0), counts())).toEqual("$!!.invalid-denum");
  // The data question that lets HC avoid building a CD that cannot exist.
  for (
    const [a, expected] of [[1, 1], [2, 1], [3, 0], [4, 1], [5, 0], [32, 1], [
      33,
      0,
    ], [64, 0]]
  ) {
    expect(call(n(ops.cdArity), n(0), counts(...Array(a).fill(0)))).toEqual(
      `${expected}`,
    );
  }
  expect(call(n(ops.cdArity), n(0), n(0))).toEqual("0");
  expect(call(n(ops.cdArity))).toEqual("0");
  // Refusals the HC classes cannot raise themselves.
  expect(call(n(ops.refuseNotCD))).toEqual("$!.denum-not-cd");
  expect(call(n(ops.refuseMixed))).toEqual("$!.denum-mixed");
});

/**
 * Evaluates the bundled class file followed by a probe, in a namespace of its
 * own, so a test can use both public constructors directly.
 */
const probe = (code: string): string => {
  const namespace = new FrameArray([]);
  const source = `${HC_SOURCES.get(DENUM_SOURCE)}\n${code}`;
  return `${evaluateSourceText(source, EvaluationScope.root(namespace))}`;
};

Deno.test("mixed Denum and CD operands refuse in both directions, at every operator", () => {
  const defs = ".g (Denum [1, [1, 0, 0, 0]]); .c (CD [1, [1, 0, 0, 0]]);";
  const run = (expression: string) => probe(`${defs} ${expression}`);
  expect(run("g + c")).toEqual("$!.denum-mixed");
  expect(run("c + g")).toEqual("$!.denum-mixed");
  expect(run("c - g")).toEqual("$!.denum-mixed");
  expect(run("c * g")).toEqual("$!.denum-mixed");
  expect(run("g - c")).toEqual("$!.denum-not-cd");
  expect(run("g * c")).toEqual("$!.denum-not-cd");
  // Lookalikes are neither type, whatever the operator or the order.
  const fake = ".f [.count 1; .loads [1, 0, 0, 0]];";
  for (const operator of ["+", "-", "*"]) {
    expect(run(`${fake} c ${operator} f`)).toEqual("$!!.invalid-denum");
  }
  expect(run(`${fake} g + f`)).toEqual("$!!.invalid-denum");
  // Same-type operands work and keep their type.
  expect(run("“” (g + g)")).toContain("Denum(Arity[4], C=2");
  expect(run("“” (c + c)")).toContain("CD[2](C=2");
});

Deno.test("the ranked hash recognizes a generic Denum by type, not by arity", () => {
  const defs = ".g (Denum [1, [1, 0, 0, 0]]); .c (CD [1, [1, 0, 0, 0]]);";
  const run = (expression: string) => probe(`${defs} ${expression}`);
  expect(run("[g.#2, g.#3, g.#0]")).toContain("$!.denum-not-cd");
  expect(run("“” (c.#3)")).toContain("CD[3](C=1");
  // A lookalike is measured as an ordinary host, never refused as a Denum.
  expect(
    run(
      ".f [.count 9; .loads [3, 1]; .# {99}; .## {99}; .### {99}]; “” (f.#1)",
    ),
  ).toEqual("“CD[1](C=99, W=[99, 0])”");
});
