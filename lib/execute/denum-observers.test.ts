/**
 * The geometric observers of a Count-bound Denum, `.##%` … `.###%%%`
 * (occurrence/figure 007.41b, 007.41c), run through a bare evaluator: no root,
 * no import, the bundled class reached through the Denum prologue.
 */
import { expect } from "jsr:@std/expect@^0.219.1";
import {
  Frame,
  FrameArray,
  FrameCount,
  FrameExpr,
  FrameInt,
  FrameNumber,
  FrameRational,
} from "../frames.ts";
import { evaluate } from "./evaluate.ts";
import { constructDenum } from "./denum-prologue.ts";

const SIMPLEX = ["##%", "###%"] as const;
const CD = ["##%%", "###%%"] as const;
const CROSS = ["##%%%", "###%%%"] as const;
const ALL = [...SIMPLEX, ...CD, ...CROSS];

const count = (n: bigint): FrameCount => new FrameCount(n);
const denum = (c: bigint, loads: readonly bigint[]): Frame =>
  constructDenum(count(c), loads.map(count));

/** The value of the last statement of a bare source, with host bindings. */
const value = (source: string, host: Record<string, Frame> = {}): Frame => {
  let answer = FrameExpr.answeredValue(evaluate(source, host).at(-1))
    .referent();
  while (!(answer instanceof FrameArray) && answer.asArray().length > 1) {
    answer = FrameExpr.answeredValue(answer.asArray().at(-1)!).referent();
  }
  return answer;
};

/** One observer of `Denum [c, loads]`, asked from HC source. */
const observe = (c: bigint, loads: readonly bigint[], key: string): Frame =>
  value(`$$.d.${key}`, { d: denum(c, loads) });

const text = (frame: Frame): string => `${frame}`;

Deno.test("simplex .##% and .###% match the 007.41b worked examples", () => {
  // (Denum [3, [2, 5, 3, 7, 4]]).#% has loads [9, 9, 3], S = 21: centered
  // numerators [6, 6, −12] over 3, so the coordinates are [2, 2, −4], Q = 36.
  const loads = [2n, 5n, 3n, 7n, 4n];
  expect(text(observe(3n, loads, "##%"))).toEqual("36");
  expect(text(observe(3n, loads, "###%"))).toEqual("[2, 2, -4]");
  expect(text(observe(2n, [3n, 1n], "##%"))).toEqual("4");
  expect(text(observe(2n, [3n, 1n], "###%"))).toEqual("[1, -1]");
  expect(text(observe(4n, [2n, 4n, 2n, 4n], "##%"))).toEqual("16/3");
  expect(text(observe(4n, [2n, 4n, 2n, 4n], "###%")))
    .toEqual("[-1, 1, -1, 1]");
  // Uniform loads have no residual, and a non-whole centre stays exact.
  expect(text(observe(3n, [4n, 4n, 4n], "##%"))).toEqual("0");
  expect(text(observe(3n, [4n, 4n, 4n], "###%"))).toEqual("[0, 0, 0]");
  expect(text(observe(3n, [1n, 0n, 0n], "###%")))
    .toEqual("[2/3, -1/3, -1/3]");
  expect(text(observe(3n, [1n, 0n, 0n], "##%"))).toEqual("1");
});

Deno.test("simplex observers are shift-invariant and their residual sums to zero", () => {
  const base = [9n, 2n, 5n, 0n, 7n];
  for (const k of [0n, 1n, 13n, 10n ** 30n]) {
    const shifted = base.map((load) => load + k);
    expect(text(observe(5n, shifted, "##%")))
      .toEqual(text(observe(5n, base, "##%")));
    expect(text(observe(5n, shifted, "###%")))
      .toEqual(text(observe(5n, base, "###%")));
  }
  const residual = observe(5n, base, "###%").elements();
  const [num, den] = residual.reduce<[bigint, bigint]>((acc, coordinate) => {
    const [n, d] = coordinate instanceof FrameRational
      ? [coordinate.numerator, coordinate.denominator]
      : [(coordinate as FrameInt).data as bigint, 1n];
    return [acc[0] * d + n * acc[1], acc[1] * d];
  }, [0n, 1n]);
  expect(num).toEqual(0n);
  expect(den > 0n).toBe(true);
});

Deno.test("Count 1 is the degenerate simplex and the real Cayley–Dickson case", () => {
  for (const loads of [[5n], [5n, 3n, 9n]]) {
    expect(text(observe(1n, loads, "##%"))).toEqual("0");
    expect(text(observe(1n, loads, "###%"))).toEqual("[0]");
    expect(text(observe(1n, loads, "##%%"))).toEqual("0");
    expect(text(observe(1n, loads, "###%%"))).toEqual("[0]");
    expect(text(observe(1n, loads, "##%%%"))).toEqual("$!.denum-cross-count");
  }
});

Deno.test("Cayley–Dickson .##%% is exactly the simplex magnitude at every C = 2ⁿ", () => {
  let seed = 7n;
  const next = (): bigint =>
    (seed = (seed * 1103515245n + 12345n) % 2147483648n) % 50n;
  for (const c of [1n, 2n, 4n, 8n, 16n, 32n]) {
    for (let trial = 0; trial < 5; trial++) {
      const loads = Array.from({ length: Number(c) + trial }, next);
      const simplex = observe(c, loads, "##%");
      const cd = observe(c, loads, "##%%");
      expect(text(cd)).toEqual(text(simplex));
      expect(cd.constructor).toBe(simplex.constructor);
      // The coordinates' squares add up to the exact norm within doubles.
      const coordinates = observe(c, loads, "###%%").elements();
      expect(coordinates.length).toEqual(Number(c));
      expect(text(coordinates[0])).toEqual("0");
      const norm = coordinates.reduce((s, x) => s + Number(x) ** 2, 0);
      expect(Math.abs(norm - Number(simplex)))
        .toBeLessThanOrEqual(1e-12 * Math.max(1, Number(simplex)));
    }
  }
});

Deno.test("Cayley–Dickson coordinates are exact where rational and doubles otherwise", () => {
  // C = 2, B = [3, 1]: x = [0, 2], and x² = −4 in CD while the simplex
  // magnitude is +4 (007.41b §4); the observer reports only x and N(x).
  const two = observe(2n, [3n, 1n], "###%%").elements();
  expect(two.map(text)).toEqual(["0", "2"]);
  expect(two.every((x) => x instanceof FrameInt)).toBe(true);
  expect(text(observe(2n, [3n, 1n], "##%%"))).toEqual("4");
  // C = 4: coordinate 3 has the rational scale 1/9; 1 and 2 are irrational.
  const four = observe(4n, [2n, 4n, 2n, 7n], "###%%").elements();
  expect(text(four[0])).toEqual("0");
  expect(four[1]).toBeInstanceOf(FrameNumber);
  expect(four[2]).toBeInstanceOf(FrameNumber);
  expect(text(four[3])).toEqual("-13/3");
  expect(Number(four[1])).toBeCloseTo(-2 * Math.sqrt(4 / 3) / Math.sqrt(2), 12);
  expect(Number(four[2])).toBeCloseTo(2 * Math.sqrt(4 / 3) / Math.sqrt(6), 12);
  expect(text(observe(4n, [2n, 4n, 2n, 7n], "##%%"))).toEqual("67/3");
  // A zero Helmert numerator is the exact 0.
  expect(text(observe(4n, [3n, 3n, 3n, 3n], "###%%"))).toEqual("[0, 0, 0, 0]");
});

Deno.test("Cayley–Dickson observers refuse a Count that is not a power of two", () => {
  for (const c of [3n, 5n, 6n, 7n, 12n]) {
    for (const key of CD) {
      expect(text(observe(c, [1n, 2n], key))).toEqual("$!.denum-cd-count");
    }
  }
});

Deno.test("cross-polytope .##%%% and .###%%% pair bᵢ with b(i+n) (007.41b §5.A)", () => {
  expect(text(observe(4n, [2n, 4n, 2n, 4n], "###%%%"))).toEqual("[0, 0]");
  expect(text(observe(4n, [2n, 4n, 2n, 4n], "##%%%"))).toEqual("0");
  expect(text(observe(6n, [5n, 2n, 3n, 5n, 1n, 3n], "###%%%")))
    .toEqual("[0, 1, 0]");
  expect(text(observe(6n, [5n, 2n, 3n, 5n, 1n, 3n], "##%%%"))).toEqual("1");
  expect(text(observe(2n, [3n, 1n], "###%%%"))).toEqual("[2]");
  expect(text(observe(2n, [3n, 1n], "##%%%"))).toEqual("4");
  expect(text(observe(8n, [0n, 0n, 0n, 0n, 1n, 2n, 3n, 4n], "###%%%")))
    .toEqual("[-1, -2, -3, -4]");
  expect(observe(4n, [2n, 4n, 2n, 4n], "###%%%").elements()[0])
    .toBeInstanceOf(FrameInt);
  // Odd C refuses only this one-load-per-vertex binding.
  for (const c of [1n, 3n, 5n, 7n]) {
    for (const key of CROSS) {
      expect(text(observe(c, [1n, 2n], key))).toEqual("$!.denum-cross-count");
    }
  }
});

Deno.test("each observer reads the receiver's own .#% and leaves it unchanged", () => {
  const d = denum(3n, [2n, 5n, 3n, 7n, 4n]);
  const before = `${d.toText()}`;
  const bound = d.sizeFor("#%");
  for (const key of ALL) {
    expect(text(d.sizeFor(key))).toEqual(text(bound.sizeFor(key)));
  }
  expect(`${d.toText()}`).toEqual(before);
  // Native observers are untouched.
  expect([
    d.sizeFor("#"),
    d.sizeFor("##"),
    d.sizeFor("###"),
    d.sizeFor("####").toText(),
    bound.toText(),
  ].map(text)).toEqual([
    "3",
    "21",
    "-3",
    "“Denum(3,[2, 5, 3, 7, 4])”",
    "“Denum(3,[9, 9, 3])”",
  ]);
  // A Denum that has grown its Count binds, then observes, the new Count.
  const grown = value("((([5, 3].####) 2) 4)");
  expect(text(grown.sizeFor("#"))).toEqual("4");
  expect(text(grown.sizeFor("###%%%")))
    .toEqual(text(grown.sizeFor("#%").sizeFor("###%%%")));
});

Deno.test("observers answer fresh values of the documented types", () => {
  const d = denum(4n, [2n, 4n, 2n, 7n]);
  expect(d.sizeFor("##%")).toBeInstanceOf(FrameRational);
  expect(denum(3n, [2n, 5n]).sizeFor("##%")).toBeInstanceOf(FrameCount);
  expect(d.sizeFor("##%%%")).toBeInstanceOf(FrameCount);
  for (const key of ["###%", "###%%", "###%%%"]) {
    const first = d.sizeFor(key);
    expect(first).toBeInstanceOf(FrameArray);
    expect(first === d.sizeFor(key)).toBe(false);
  }
  // Coordinates are signed FrameInts when whole, even when nonnegative.
  expect(
    denum(3n, [2n, 5n, 3n, 7n, 4n]).sizeFor("###%").elements()
      .every((x) => x instanceof FrameInt),
  ).toBe(true);
  expect(d.sizeFor("###%").elements()[0]).toBeInstanceOf(FrameRational);
});

Deno.test("failures of .#% pass through every observer, in its order", () => {
  for (const key of ALL) {
    for (const source of ["[5, 3]", "3", "()", "“ab”", "{1}", "[]"]) {
      expect(text(value(`${source}.${key}`))).toEqual(
        "$!.denum-binding-receiver",
      );
    }
    expect(text(observe(0n, [2n, 5n], key)))
      .toEqual("$!.denum-binding-zero-count");
    expect(text(observe(70000n, [1n], key)))
      .toEqual("$!.denum-binding-capacity");
    expect(text(observe(10n ** 30n, [1n], key)))
      .toEqual("$!.denum-binding-capacity");
    // A class cannot declare an observer: the method is never run.
    expect(text(value(`[.${key} {7}].${key}`)))
      .toEqual("$!.denum-binding-receiver");
    const stored = Frame.error("$!.stored");
    expect(stored.sizeFor(key)).toBe(stored);
  }
});

Deno.test("observers are exact for loads past 2⁵³", () => {
  const big = 123456789012345678901234567890n;
  // B = [big, 1]: Q_S = (2(big² + 1) − (big + 1)²)/1 = (big − 1)².
  expect(text(observe(2n, [big, 1n], "##%"))).toEqual(`${(big - 1n) ** 2n}`);
  expect(text(observe(2n, [big, 1n], "##%%"))).toEqual(`${(big - 1n) ** 2n}`);
  expect(text(observe(2n, [big, 1n], "###%%%"))).toEqual(`[${big - 1n}]`);
  expect(text(observe(2n, [big, 1n], "###%%"))).toEqual(`[0, ${big - 1n}]`);
});

Deno.test("observers dispatch through names, handles, tight terms and closures", () => {
  const d = denum(3n, [2n, 5n, 3n, 7n, 4n]);
  expect(text(value(".e $$.d; e.##%", { d }))).toEqual("36");
  expect(text(value(".e $$.d; [e.##%, e .##%, (e).###%]", { d })))
    .toEqual("[36, 36, [2, 2, -4]]");
  expect(text(value(".f {_.##%}; f $$.d", { d }))).toEqual("36");
  expect(text(value("[5, 3, 7].####.##%"))).toEqual("117");
  expect(text(value("[5, 3, 7].####.###%"))).toEqual("[7, -2, -5]");
  // Native readings of the observations themselves are ordinary.
  expect(text(value(".e $$.d; [e.###%.#, (e.###%) .2, (e.##%) + 1]", { d })))
    .toEqual("[3, -4, 37]");
  // `.## %%` stays Size modulo.
  expect(text(value("[5, 3, 1].## %% 2"))).toEqual("1");
});
