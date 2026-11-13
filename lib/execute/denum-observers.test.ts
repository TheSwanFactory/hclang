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
  FrameRational,
} from "../frames.ts";
import { evaluate } from "./evaluate.ts";
import { constructDenum } from "./denum-prologue.ts";
import { GEOMETRIES } from "../frames/denum-observers.ts";
import { cdProduct } from "../frames/cayley-dickson.ts";

const SIMPLEX = ["##%", "###%"] as const;
const KDSL = ["##%%%", "###%%%"] as const;
const KPSL = ["##%%", "###%%"] as const;
const ALL = [...SIMPLEX, ...KPSL, ...KDSL];

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

/** Asserts `[residual, size]` of one observer family for `Denum [r, loads]`. */
const reads = (
  suffix: string,
  r: bigint,
  loads: readonly bigint[],
  residual: string,
  size: string,
): void => {
  expect(text(observe(r, loads, `###${suffix}`))).toEqual(residual);
  expect(text(observe(r, loads, `##${suffix}`))).toEqual(size);
};

Deno.test("KDSL reads the signed-basis residual (007.43h witnesses)", () => {
  // Rank 2, four slots: the discriminating cancellation, not the Helmert 16/3.
  reads("%%%", 2n, [2n, 4n, 2n, 4n], "[0, 0]", "0");
  reads("%%%", 2n, [3n, 2n, 1n, 4n], "[2, -2]", "8");
  // Rank 1: one signed integer. Rank 3: scalar plus three imaginary pairs.
  reads("%%%", 1n, [5n, 3n], "[2]", "4");
  reads("%%%", 1n, [3n, 5n], "[-2]", "4");
  reads("%%%", 3n, [9n, 1n, 2n, 3n, 4n, 5n, 6n, 7n], "[5, -4, -4, -4]", "73");
  // Rank 0: the single value itself.
  reads("%%%", 0n, [5n], "[5]", "25");
  // Each antipodal pair cancels on its own, and shifting a pair keeps R.
  reads("%%%", 3n, [1n, 2n, 3n, 4n, 1n, 2n, 3n, 4n], "[0, 0, 0, 0]", "0");
  reads("%%%", 3n, [11n, 2n, 3n, 4n, 11n, 2n, 3n, 4n], "[0, 0, 0, 0]", "0");
  reads("%%%", 2n, [7n, 4n, 5n, 4n], "[2, 0]", "4");
});

Deno.test("Count is the rank: KDSL pads short and wraps long loads at ranks 0–3", () => {
  // Rank 0 wants 1 slot: everything wraps onto it.
  reads("%%%", 0n, [5n, 3n, 9n], "[17]", "289");
  // Rank 1 wants 2: pad, exact, wrap.
  reads("%%%", 1n, [5n], "[5]", "25");
  reads("%%%", 1n, [5n, 3n, 9n], "[11]", "121");
  // Rank 2 wants 4: [3, 1] pads to [3, 1, 0, 0]; six loads wrap to [6, 8, 3, 4].
  reads("%%%", 2n, [3n, 1n], "[3, 1]", "10");
  reads("%%%", 2n, [1n, 2n, 3n, 4n, 5n, 6n], "[3, 4]", "25");
  // Rank 3 wants 8: one load pads to [1, 0, …]; nine wrap the ninth onto 0.
  reads("%%%", 3n, [1n], "[1, 0, 0, 0]", "1");
  reads(
    "%%%",
    3n,
    [1n, 2n, 3n, 4n, 5n, 6n, 7n, 8n, 9n],
    "[5, -4, -4, -4]",
    "73",
  );
});

Deno.test("KPSL keeps the antipodal formula at 2r slots and aligns the rest", () => {
  // Matching slots: unchanged from the shipped residual.
  reads("%%", 2n, [2n, 4n, 2n, 4n], "[0, 0]", "0");
  reads("%%", 3n, [5n, 2n, 3n, 5n, 1n, 3n], "[0, 1, 0]", "1");
  reads("%%", 4n, [0n, 0n, 0n, 0n, 1n, 2n, 3n, 4n], "[-1, -2, -3, -4]", "30");
  // Rank 0 wants no slots: the empty residual, Size 0.
  reads("%%", 0n, [4n, 5n], "[]", "0");
  // Rank 1 wants 2.
  reads("%%", 1n, [5n], "[5]", "25");
  reads("%%", 1n, [5n, 3n, 2n], "[4]", "16");
  // Rank 2 wants 4.
  reads("%%", 2n, [1n, 2n], "[1, 2]", "5");
  reads("%%", 2n, [1n, 2n, 3n, 4n, 5n, 6n], "[3, 4]", "25");
  // Rank 3 wants 6.
  reads("%%", 3n, [1n, 2n, 3n], "[1, 2, 3]", "14");
  reads("%%", 3n, [1n, 2n, 3n, 4n, 5n, 6n, 7n, 8n], "[4, 5, -3]", "50");
});

Deno.test("SSL keeps the centered formula at r+1 slots and aligns the rest", () => {
  // Matching slots: the 007.41b worked examples.
  reads("%", 2n, [9n, 9n, 3n], "[2, 2, -4]", "36");
  reads("%", 1n, [3n, 1n], "[1, -1]", "4");
  reads("%", 3n, [2n, 4n, 2n, 4n], "[-1, 1, -1, 1]", "16/3");
  reads("%", 2n, [4n, 4n, 4n], "[0, 0, 0]", "0");
  reads("%", 2n, [1n, 0n, 0n], "[2/3, -1/3, -1/3]", "1");
  // Rank 0 wants 1 slot, the degenerate simplex.
  reads("%", 0n, [5n, 3n], "[0]", "0");
  // Rank 1 pads, rank 2 pads and wraps (five loads fold to [9, 9, 3]).
  reads("%", 1n, [3n], "[3/2, -3/2]", "9");
  reads("%", 2n, [3n], "[2, -1, -1]", "9");
  reads("%", 2n, [2n, 5n, 3n, 7n, 4n], "[2, 2, -4]", "36");
});

Deno.test("every Count has a defined reading under every observer", () => {
  for (const key of ALL) {
    for (let r = 0n; r <= 6n; r++) {
      for (const loads of [[1n], [1n, 2n, 3n], [1n, 2n, 3n, 4n, 5n, 6n, 7n]]) {
        const answer = observe(r, loads, key);
        expect(text(answer).startsWith("$!")).toBe(false);
      }
    }
  }
});

Deno.test("simplex observers are shift-invariant and their residual sums to zero", () => {
  const base = [9n, 2n, 5n, 0n, 7n, 1n];
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

Deno.test("the geometry table and Frame's observer spellings agree", () => {
  expect(Object.keys(GEOMETRIES)).toEqual([...Frame.GEOMETRY_SUFFIXES]);
  expect([...Frame.GEOMETRIC_OBSERVERS]).toEqual(ALL);
});

Deno.test("observers read the stored loads and leave the receiver and natives unchanged", () => {
  const d = denum(3n, [2n, 5n, 3n, 7n, 4n]);
  const before = `${d.toText()}`;
  for (const key of ALL) d.sizeFor(key);
  expect(`${d.toText()}`).toEqual(before);
  const bound = d.sizeFor("#%");
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
  // A Denum that has grown its Count is read at the new rank.
  const grown = value("((([5, 3].####) 2) 4)");
  expect(text(grown.sizeFor("#"))).toEqual("4");
  // Loads [7, 7] at rank 4 pad to 8 slots, so four antipodal differences.
  expect(text(grown.sizeFor("###%%"))).toEqual("[7, 7, 0, 0]");
});

Deno.test("observers answer fresh values of the documented types", () => {
  const d = denum(3n, [2n, 4n, 2n, 7n]);
  expect(denum(3n, [2n, 5n, 3n, 7n]).sizeFor("##%")).toBeInstanceOf(
    FrameRational,
  );
  expect(denum(2n, [2n, 5n, 3n]).sizeFor("##%")).toBeInstanceOf(FrameCount);
  expect(d.sizeFor("##%%")).toBeInstanceOf(FrameCount);
  expect(d.sizeFor("##%%%")).toBeInstanceOf(FrameCount);
  for (const key of ["###%", "###%%%", "###%%"]) {
    const first = d.sizeFor(key);
    expect(first).toBeInstanceOf(FrameArray);
    expect(first === d.sizeFor(key)).toBe(false);
  }
  // Signed integer coordinates are FrameInts, even when nonnegative.
  for (const key of ["###%%%", "###%%"]) {
    expect(d.sizeFor(key).elements().every((x) => x instanceof FrameInt))
      .toBe(true);
  }
  expect(d.sizeFor("###%").elements()[0]).toBeInstanceOf(FrameRational);
});

Deno.test("receiver failures pass through every observer; Count zero is a rank", () => {
  for (const key of ALL) {
    for (const source of ["[5, 3]", "3", "()", "“ab”", "{1}", "[]"]) {
      expect(text(value(`${source}.${key}`))).toEqual(
        "$!.denum-binding-receiver",
      );
    }
    expect(text(observe(0n, [2n, 5n], key)).startsWith("$!")).toBe(false);
    // A class cannot declare an observer: the method is never run.
    expect(text(value(`[.${key} {7}].${key}`)))
      .toEqual("$!.denum-binding-receiver");
    const stored = Frame.error("$!.stored");
    expect(stored.sizeFor(key)).toBe(stored);
  }
});

Deno.test("the wanted length is bounded by the binding capacity (65536)", () => {
  // SSL wants r+1, KPSL 2r, KDSL 2ʳ slots; each is inclusive at 65536.
  expect(text(observe(65535n, [1n], "##%"))).toEqual("1");
  expect(observe(65535n, [1n], "###%").elements().length).toEqual(65536);
  expect(text(observe(65536n, [1n], "##%")))
    .toEqual("$!.denum-binding-capacity");
  expect(observe(32768n, [1n], "###%%").elements().length).toEqual(32768);
  expect(text(observe(32769n, [1n], "##%%")))
    .toEqual("$!.denum-binding-capacity");
  expect(observe(16n, [1n], "###%%%").elements().length).toEqual(32768);
  expect(text(observe(16n, [1n], "##%%%"))).toEqual("1");
  for (const key of KDSL) {
    expect(text(observe(17n, [1n], key))).toEqual("$!.denum-binding-capacity");
    expect(text(observe(10n ** 30n, [1n], key)))
      .toEqual("$!.denum-binding-capacity");
  }
});

Deno.test("observers are exact for loads past 2⁵³", () => {
  const big = 123456789012345678901234567890n;
  reads(
    "%",
    1n,
    [big, 1n],
    `[${big - 1n}/2, ${-(big - 1n)}/2]`,
    `${(big - 1n) ** 2n}`,
  );
  reads("%%%", 1n, [big, 1n], `[${big - 1n}]`, `${(big - 1n) ** 2n}`);
  reads("%%", 1n, [big, 1n], `[${big - 1n}]`, `${(big - 1n) ** 2n}`);
});

Deno.test("observers dispatch through names, handles, tight terms and closures", () => {
  const d = denum(2n, [9n, 9n, 3n]);
  expect(text(value(".e $$.d; e.##%", { d }))).toEqual("36");
  expect(text(value(".e $$.d; [e.##%, e .##%, (e).###%]", { d })))
    .toEqual("[36, 36, [2, 2, -4]]");
  expect(text(value(".f {_.##%}; f $$.d", { d }))).toEqual("36");
  // [5, 3, 7].#### is Count 3 with loads [12, 3]: SSL pads to 4 slots.
  expect(text(value("[5, 3, 7].####.##%"))).toEqual("129");
  expect(text(value("[5, 3, 7].####.###%")))
    .toEqual("[33/4, -3/4, -15/4, -15/4]");
  expect(text(value(".e $$.d; [e.###%.#, (e.###%) .2, (e.##%) + 1]", { d })))
    .toEqual("[3, -4, 37]");
  // `.## %%` stays Size modulo.
  expect(text(value("[5, 3, 1].## %% 2"))).toEqual("1");
});

Deno.test("suffix order is the contract: % is SSL, %% is KPSL, %%% is KDSL (007.46)", () => {
  expect(Frame.GEOMETRY_SUFFIXES).toEqual(["%", "%%", "%%%"]);
  expect(Frame.GEOMETRIC_OBSERVERS).toEqual([
    "##%",
    "###%",
    "##%%",
    "###%%",
    "##%%%",
    "###%%%",
  ]);
  const wanted = (suffix: string, r: bigint): bigint =>
    GEOMETRIES[suffix].wanted(r);
  // Count is the rank N: SSL N+1 (released; N vs N+1 awaits an owner
  // decision), KPSL 2N, KDSL 2^N.
  for (
    const [r, ssl, kpsl, kdsl] of [
      [0n, 1n, 0n, 1n],
      [1n, 2n, 2n, 2n],
      [2n, 3n, 4n, 4n],
      [3n, 4n, 6n, 8n],
      [4n, 5n, 8n, 16n],
    ]
  ) {
    expect(wanted("%", r)).toEqual(ssl);
    expect(wanted("%%", r)).toEqual(kpsl);
    expect(wanted("%%%", r)).toEqual(kdsl);
  }
});

Deno.test("KPSL (%%) and KDSL (%%%) are distinguished where 2N ≠ 2^N (N = 3)", () => {
  // Rank 3: KPSL wants 6 slots, KDSL wants 8.
  const six = [5n, 2n, 3n, 5n, 1n, 3n];
  reads("%%", 3n, six, "[0, 1, 0]", "1");
  // The same six loads padded to 8 slots read as KDSL: four differences.
  reads("%%%", 3n, six, "[4, -1, 3, 5]", "51");
  // Eight loads: KPSL wraps 7 and 8 onto slots 1 and 2.
  const eight = [1n, 2n, 3n, 4n, 5n, 6n, 7n, 8n];
  reads("%%", 3n, eight, "[4, 5, -3]", "50");
  reads("%%%", 3n, eight, "[-4, -4, -4, -4]", "64");
  expect(observe(3n, eight, "###%%").elements().length).toEqual(3);
  expect(observe(3n, eight, "###%%%").elements().length).toEqual(4);
});

Deno.test("KPSL and KDSL share their Size at N = 2 and still differ by spelling", () => {
  // Rank 2: both want 4 slots, so every reading coincides. The suffix, not the
  // arithmetic, is what a rank-3 program can tell apart.
  for (const loads of [[3n, 2n, 1n, 4n], [2n, 4n, 2n, 4n], [1n, 2n, 3n]]) {
    expect(text(observe(2n, loads, "##%%"))).toEqual(
      text(observe(2n, loads, "##%%%")),
    );
    expect(text(observe(2n, loads, "###%%"))).toEqual(
      text(observe(2n, loads, "###%%%")),
    );
  }
  expect(text(observe(2n, [3n, 2n, 1n, 4n], "##%%"))).toEqual("8");
  expect(text(observe(2n, [3n, 2n, 1n, 4n], "##%%%"))).toEqual("8");
});

Deno.test("capacity bounds follow the suffix: %% saturates at rank 32768, %%% at 16", () => {
  expect(text(observe(32769n, [1n], "##%%"))).toEqual(
    "$!.denum-binding-capacity",
  );
  expect(text(observe(17n, [1n], "##%%%"))).toEqual(
    "$!.denum-binding-capacity",
  );
});

/** The observed `.###%%%` coefficients of `Denum [r, loads]` as bigints. */
const coefficients = (r: bigint, loads: readonly bigint[]): bigint[] =>
  (JSON.parse(text(observe(r, loads, "###%%%"))) as number[]).map(BigInt);

Deno.test("observed KDSL coefficients feed the Cayley–Dickson oracle at rung r−1 (007.46b)", () => {
  // [rank, loads (2ʳ), coefficients (2^(r−1)), oracle square]. The oracle is a
  // TypeScript reference; native `*` does not implement it.
  const witnesses: [bigint, bigint[], bigint[], bigint[]][] = [
    [1n, [5n, 3n], [2n], [4n]],
    [2n, [3n, 2n, 1n, 4n], [2n, -2n], [0n, -8n]],
    [
      3n,
      [9n, 1n, 2n, 3n, 4n, 5n, 6n, 7n],
      [5n, -4n, -4n, -4n],
      [-23n, -40n, -40n, -40n],
    ],
    [
      4n,
      [3n, 0n, 5n, 1n, 2n, 7n, 0n, 4n, 0n, 2n, 1n, 6n, 2n, 3n, 5n, 0n],
      [3n, -2n, 4n, -5n, 0n, 4n, -5n, 4n],
      [-93n, -12n, 24n, -30n, 0n, 24n, -30n, 24n],
    ],
  ];
  for (const [r, loads, observed, square] of witnesses) {
    expect(loads.length).toEqual(2 ** Number(r));
    const seen = coefficients(r, loads);
    expect(seen).toEqual(observed);
    expect(seen.length).toEqual(2 ** (Number(r) - 1));
    expect(cdProduct(seen, seen)).toEqual(square);
  }
});
