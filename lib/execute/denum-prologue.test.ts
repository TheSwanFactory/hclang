import { expect } from "jsr:@std/expect@^0.219.1";
import { denum, Frame, FrameArray, FrameCount, FrameExpr } from "../frames.ts";
import { HC_SOURCES } from "../bundle/hc-sources.ts";
import { DenumEngine } from "../ops/denum.ts";
import { evaluate } from "./evaluate.ts";
import {
  constructDenum,
  DENUM_SOURCE,
  denumClass,
  loadDenumClass,
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

/** A Denum instance's rank, Count and loads, read from its HC fields. */
const state = (instance: Frame): string =>
  `${instance.getOwn("rank")}|${instance.getOwn("count")}|${
    instance.getOwn("loads")
  }`;

const counts = (...values: number[]): FrameArray =>
  new FrameArray(values.map((n) => new FrameCount(BigInt(n))));

Deno.test("the ranked hash constructs the HC class in a bare evaluator", () => {
  expect(evaluate("X <- './hc/denum.hc'; X").toString()).toContain("$!");
  const d = value("[1, 2, 3].#2");
  expect(d).toBeInstanceOf(FrameArray);
  expect(state(d)).toEqual("2|3|[4, 0, 2, 0]");
  expect(d.toText().toString()).toEqual("“Denum(CD[2], C=3, W=[4, 0, 2, 0])”");
});

Deno.test("each rank answers the Denum of that rung, with no #n= form", () => {
  const ranks = [0, 1, 2, 3, 4, 5];
  const widths = ranks.map((n) =>
    (value(`[1, 2, 3].#${n}`).getOwn("loads") as FrameArray).elements().length
  );
  expect(widths).toEqual([1, 2, 4, 8, 16, 32]);
  for (const n of ranks) {
    expect(`${value(`[1, 2, 3].#${n}`).getOwn("schema")}`).toEqual(
      `“CD[${n}]”`,
    );
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
  expect(state(value("[1, 2, 3].#1"))).toEqual("1|3|[4, 2]");
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
  expect(state(value("[5, 1].#1"))).toEqual("1|2|[5, 1]");
  expect(state(value("[5, 1].#1.#3"))).toEqual("3|2|[5, 0, 0, 0, 1, 0, 0, 0]");
  expect(text("[5, 1].#3.#1")).toEqual("$!.denum-demotion");
  // Count zero is present for an instance, unlike a childless host.
  const zero = constructDenum(denum.denum(1, 0n, [3n, 1n]));
  expect(state(zero)).toEqual("1|0|[3, 1]");
  expect(zero.sizeFor("#3")).toBeInstanceOf(FrameArray);
  expect(state(zero.sizeFor("#3"))).toEqual("3|0|[3, 0, 0, 0, 1, 0, 0, 0]");
});

Deno.test("a forged lookalike is measured like any host, not recognized", () => {
  const fake = value(
    "[.rank 1; .count 9; .loads [3, 1]; .# {99}; .## {99}; .### {99}].#1",
  );
  expect(state(fake)).toEqual("1|99|[99, 0]");
});

Deno.test("the class loads once, and a missing source is a named error", () => {
  expect(denumClass()).toBe(denumClass());
  expect(loadDenumClass(undefined).toString()).toContain(
    "$!.denum-prologue-missing",
  );
  expect(HC_SOURCES.get(DENUM_SOURCE)).toBeDefined();
  expect(loadDenumClass("this is not hc (").isFailedResult()).toBe(true);
});

Deno.test("denum-engine refuses malformed requests with named errors", () => {
  const call = (...args: Frame[]): string =>
    `${DenumEngine(Frame.nil, new FrameArray(args))}`;
  const n = (v: number): FrameCount => new FrameCount(BigInt(v));
  expect(call()).toEqual("$!!.invalid-denum");
  expect(call(n(99), n(1), n(0), counts(0, 0))).toEqual("$!!.invalid-denum");
  expect(call(n(0), n(1), n(0), counts(0))).toEqual("$!!.invalid-denum");
  expect(call(n(0), n(9), n(0), counts(0))).toEqual("$!!.invalid-denum");
  expect(call(n(0), n(1), n(0), counts(0, 0))).toEqual("[1, 0, [0, 0]]");
  expect(call(n(6), n(2), n(0), counts(0, 0, 0, 0), n(1))).toEqual(
    "$!.denum-demotion",
  );
  expect(call(n(6), n(1), n(0), counts(0, 0), n(7))).toEqual("$!.denum-rank");
  // A binary operation without its right operand is refused, not defaulted.
  expect(call(n(3), n(1), n(0), counts(0, 1))).toEqual("$!!.invalid-denum");
  // Rank mismatch is promotion, not an error.
  expect(
    call(n(3), n(1), n(1), counts(0, 1), n(2), n(1), counts(0, 1, 0, 0)),
  ).toEqual("[2, 1, [0, 0, 0, 1]]");
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
  const state = [n(7), n(2), n(1), counts(3, 2, 1, 4)];
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
        if (text(`${s}.rank`) === "()") continue;
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
        } else if (text(`${s}.rank`) === "0") {
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
