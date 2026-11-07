import { expect } from "jsr:@std/expect@^0.219.1";
import {
  add,
  arity,
  conjugate,
  coordinates,
  type Denum,
  denum,
  multiply,
  observe,
  opposite,
  parseSignature,
  promote,
} from "./denum.ts";

/**
 * Dual coordinates (occurrence/figure 007.32j, 007.32k, 007.33). The expected
 * values here are written out by hand or computed by test-only reference logic
 * (`unsignedOf`, `convolve`), never by calling the projection under test on
 * both sides.
 */

/** Test-only reference: the unsigned load of each direction, straight from W. */
function unsignedOf(x: Denum): bigint[] {
  if (x.rank === 0) return [x.loads[0]];
  const half = x.loads.length / 2;
  const out: bigint[] = [];
  for (let b = 0; b < half; b++) out.push(x.loads[b] + x.loads[b + half]);
  return out;
}

/** Test-only reference: XOR convolution `Σ_(a⊕b=k) u_a v_b`. */
function convolve(u: bigint[], v: bigint[]): bigint[] {
  const out = Array<bigint>(u.length).fill(0n);
  for (let a = 0; a < u.length; a++) {
    for (let b = 0; b < v.length; b++) out[a ^ b] += u[a] * v[b];
  }
  return out;
}

/** Deterministic pseudo-random loads so failures reproduce. */
function lcg(seed: number): () => number {
  let state = seed;
  return () => (state = (state * 1103515245 + 12345) % 2147483648);
}

const big = (...values: number[]): bigint[] => values.map(BigInt);

const unit = (rank: number, name: string): Denum => {
  const loads = Array<bigint>(arity(rank)).fill(0n);
  loads[parseSignature(rank, name)] = 1n;
  return denum(rank, 1n, loads);
};

Deno.test("the concrete 007.33 example, signed and unsigned", () => {
  const d = denum(2, 1n, big(3, 2, 1, 4));
  expect(coordinates(d)).toEqual(big(2, -2));
  expect(coordinates(d, false)).toEqual(big(2, -2));
  expect(coordinates(d, true)).toEqual(big(4, 6));
  expect(observe(d)).toEqual(big(2, -2));
  // U is not |S|, and the Count 1 is not a coordinate.
  expect(coordinates(d, true)).not.toEqual(
    coordinates(d).map((c) => c < 0n ? -c : c),
  );
  expect(d.count).toBe(1n);
  expect(d.loads).toEqual(big(3, 2, 1, 4));
});

Deno.test("first rungs D0 to D5: values, widths and ordering", () => {
  expect(coordinates(denum(0, 0n, big(3)))).toEqual(big(3));
  expect(coordinates(denum(0, 0n, big(3)), true)).toEqual(big(3));
  const d1 = denum(1, 0n, big(4, 2));
  expect(coordinates(d1)).toEqual(big(2));
  expect(coordinates(d1, true)).toEqual(big(6));
  const d3 = denum(3, 0n, big(1, 2, 3, 4, 0, 0, 0, 0));
  expect(coordinates(d3)).toEqual(big(1, 2, 3, 4));
  expect(coordinates(d3, true)).toEqual(big(1, 2, 3, 4));
  // D4: positives 1..8 then negatives 10, 20, ..., 80.
  const d4 = denum(
    4,
    0n,
    big(1, 2, 3, 4, 5, 6, 7, 8, 10, 20, 30, 40, 50, 60, 70, 80),
  );
  expect(coordinates(d4)).toEqual(big(-9, -18, -27, -36, -45, -54, -63, -72));
  expect(coordinates(d4, true)).toEqual(big(11, 22, 33, 44, 55, 66, 77, 88));
  // D5: positive b = b + 1, negative b = 100 (b + 1).
  const loads5 = [
    ...Array.from({ length: 16 }, (_, b) => BigInt(b + 1)),
    ...Array.from({ length: 16 }, (_, b) => BigInt(100 * (b + 1))),
  ];
  const d5 = denum(5, 0n, loads5);
  expect(coordinates(d5)).toEqual(
    Array.from({ length: 16 }, (_, b) => BigInt(-99 * (b + 1))),
  );
  expect(coordinates(d5, true)).toEqual(
    Array.from({ length: 16 }, (_, b) => BigInt(101 * (b + 1))),
  );
  for (let rank = 0; rank <= 5; rank++) {
    const width = rank === 0 ? 1 : 2 ** (rank - 1);
    const d = denum(rank, 0n, Array(arity(rank)).fill(1n));
    expect(coordinates(d).length).toBe(width);
    expect(coordinates(d, true).length).toBe(width);
  }
});

Deno.test("non-destructive and independent of Count", () => {
  const loads = big(3, 2, 1, 4);
  const a = denum(2, 0n, loads);
  const b = denum(2, 99n, loads);
  expect(coordinates(a)).toEqual(coordinates(b));
  expect(coordinates(a, true)).toEqual(coordinates(b, true));
  // Zero Count with positive loads, and positive Count with zero loads.
  expect(coordinates(a, true)).toEqual(big(4, 6));
  const empty = denum(2, 7n, big(0, 0, 0, 0));
  expect(coordinates(empty)).toEqual(big(0, 0));
  expect(coordinates(empty, true)).toEqual(big(0, 0));
  // Balanced opposing loads: S = 0 while U > 0.
  const balanced = denum(3, 1n, big(2, 0, 5, 0, 2, 0, 5, 0));
  expect(coordinates(balanced)).toEqual(big(0, 0, 0, 0));
  expect(coordinates(balanced, true)).toEqual(big(4, 0, 10, 0));
  // Neither mode mutates the source or aliases its loads.
  const before = JSON.stringify([...b.loads].map(String));
  const s = coordinates(b);
  const u = coordinates(b, true);
  s[0] = 1000n;
  u[0] = 1000n;
  expect(JSON.stringify([...b.loads].map(String))).toBe(before);
  expect(b.count).toBe(99n);
  expect(coordinates(b)).toEqual(big(2, -2));
  expect(coordinates(b, true)).toEqual(big(4, 6));
  // A fresh array every call.
  expect(coordinates(b)).not.toBe(coordinates(b));
  // Same loads, different Count, are different Denums with the same coordinates.
  expect(a).not.toEqual(b);
});

Deno.test("joint completeness on valid states: W± = (U ± S)/2", () => {
  const check = (x: Denum) => {
    const s = coordinates(x);
    const u = coordinates(x, true);
    expect(s.length).toBe(u.length);
    if (x.rank === 0) {
      expect(s).toEqual(u);
      return;
    }
    const half = x.loads.length / 2;
    for (let b = 0; b < half; b++) {
      // Equal parity, U ≥ |S|, and exact nonnegative integer inversion.
      expect((u[b] - s[b]) % 2n).toBe(0n);
      expect(u[b] >= (s[b] < 0n ? -s[b] : s[b])).toBe(true);
      const plus = (u[b] + s[b]) / 2n;
      const minus = (u[b] - s[b]) / 2n;
      expect(plus >= 0n && minus >= 0n).toBe(true);
      expect(plus).toBe(x.loads[b]);
      expect(minus).toBe(x.loads[half + b]);
    }
  };
  // Exhaustive: every paired load at D1 and every 3-valued load vector at D2.
  for (let p = 0; p <= 5; p++) {
    for (let m = 0; m <= 5; m++) check(denum(1, 0n, big(p, m)));
  }
  for (let i = 0; i < 81; i++) {
    const loads = [0, 1, 2, 3].map((k) => BigInt(Math.floor(i / 3 ** k) % 3));
    check(denum(2, BigInt(i), loads));
  }
  // Mixed and random ranks through D5.
  const next = lcg(7);
  for (let rank = 0; rank <= 5; rank++) {
    for (let trial = 0; trial < 50; trial++) {
      const loads = Array.from(
        { length: arity(rank) },
        () => BigInt(next() % 1000),
      );
      check(denum(rank, BigInt(next() % 5), loads));
    }
  }
});

Deno.test("unsigned coordinates add, and forget opposite and conjugate", () => {
  const next = lcg(11);
  for (const rank of [1, 2, 3, 4, 5]) {
    for (let trial = 0; trial < 20; trial++) {
      const make = () =>
        denum(
          rank,
          1n,
          Array.from({ length: arity(rank) }, () => BigInt(next() % 9)),
        );
      const x = make();
      const y = make();
      expect(coordinates(add(x, y), true)).toEqual(
        unsignedOf(x).map((c, k) => c + unsignedOf(y)[k]),
      );
      expect(coordinates(opposite(x), true)).toEqual(unsignedOf(x));
      expect(coordinates(conjugate(x), true)).toEqual(unsignedOf(x));
      // Promotion places the old summand at the front.
      expect(coordinates(promote(x, 5), true).slice(0, unsignedOf(x).length))
        .toEqual(unsignedOf(x));
    }
  }
  // D0 opposite is promoted to D1; its unsigned coordinate is the same Size.
  const z = denum(0, 1n, big(4));
  expect(coordinates(opposite(z), true)).toEqual(big(4));
});

Deno.test("D4: unsigned product is XOR convolution on all 16×16 basis pairs", () => {
  for (let i = 0; i < 16; i++) {
    for (let j = 0; j < 16; j++) {
      const xl = Array<bigint>(16).fill(0n);
      const yl = Array<bigint>(16).fill(0n);
      xl[i] = 1n;
      yl[j] = 1n;
      const x = denum(4, 1n, xl);
      const y = denum(4, 1n, yl);
      const expected = Array<bigint>(8).fill(0n);
      expected[(i % 8) ^ (j % 8)] = 1n;
      expect(coordinates(multiply(x, y), true)).toEqual(expected);
      expect(coordinates(multiply(x, y), true)).toEqual(
        convolve(unsignedOf(x), unsignedOf(y)),
      );
    }
  }
});

Deno.test("D4: unsigned product on mixed loads, symmetries, associativity", () => {
  const next = lcg(23);
  const make = () =>
    denum(4, 1n, Array.from({ length: 16 }, () => BigInt(next() % 6)));
  for (let trial = 0; trial < 40; trial++) {
    const x = make();
    const y = make();
    const z = make();
    const ux = unsignedOf(x);
    const uy = unsignedOf(y);
    const uz = unsignedOf(z);
    expect(coordinates(multiply(x, y), true)).toEqual(convolve(ux, uy));
    expect(coordinates(multiply(x, y), true)).toEqual(
      coordinates(multiply(y, x), true),
    );
    const left = coordinates(multiply(multiply(x, y), z), true);
    const right = coordinates(multiply(x, multiply(y, z)), true);
    expect(left).toEqual(right);
    expect(left).toEqual(convolve(convolve(ux, uy), uz));
    expect(coordinates(multiply(opposite(x), y), true)).toEqual(
      convolve(ux, uy),
    );
    expect(coordinates(multiply(conjugate(x), y), true)).toEqual(
      convolve(ux, uy),
    );
  }
  // Signed products need not commute or associate; U does not claim they do.
  const e1 = unit(4, "e_001");
  const e2 = unit(4, "e_010");
  expect(multiply(e1, e2).loads).not.toEqual(multiply(e2, e1).loads);
});

/** The directions of the nonzero basis Denums, from their shipped product. */
function derivedLines(): Set<string> {
  const basis = new Map<number, Denum>();
  for (let d = 1; d < 8; d++) {
    basis.set(d, unit(4, `e_${d.toString(2).padStart(3, "0")}`));
  }
  const lines = new Set<string>();
  for (let a = 1; a < 8; a++) {
    for (let b = a + 1; b < 8; b++) {
      const product = multiply(basis.get(a)!, basis.get(b)!);
      // Project away the sign: the direction is the lone nonzero U coordinate.
      const u = coordinates(product, true);
      const present = u.map((c, k) => ({ c, k })).filter(({ c }) => c !== 0n);
      expect(present.length).toBe(1);
      expect(present[0].c).toBe(1n);
      const c = present[0].k;
      expect(c).not.toBe(0);
      expect(c).not.toBe(a);
      expect(c).not.toBe(b);
      lines.add([a, b, c].sort((p, q) => p - q).join(","));
    }
  }
  return lines;
}

Deno.test("Fano incidence is derived from D4 multiplication, not installed", () => {
  const lines = derivedLines();
  const triples = [...lines].map((l) => l.split(",").map(Number));
  expect(triples.length).toBe(7);
  for (const t of triples) expect(new Set(t).size).toBe(3);
  // Each of the 21 point pairs lies in exactly one line.
  for (let a = 1; a < 8; a++) {
    for (let b = a + 1; b < 8; b++) {
      expect(triples.filter((t) => t.includes(a) && t.includes(b)).length)
        .toBe(1);
    }
  }
  // Each point lies on three lines, and any two lines meet in one point.
  for (let p = 1; p < 8; p++) {
    expect(triples.filter((t) => t.includes(p)).length).toBe(3);
  }
  for (let i = 0; i < 7; i++) {
    for (let j = i + 1; j < 7; j++) {
      expect(triples[i].filter((p) => triples[j].includes(p)).length).toBe(1);
    }
  }
  // Recorded 007.32j set, an assertion only and never the generator.
  expect([...lines].sort()).toEqual([
    "1,2,3",
    "1,4,5",
    "1,6,7",
    "2,4,6",
    "2,5,7",
    "3,4,7",
    "3,5,6",
  ]);
});

Deno.test("the D4 associator differs signed and agrees unsigned", () => {
  const e1 = unit(4, "e_001");
  const e2 = unit(4, "e_010");
  const e4 = unit(4, "e_100");
  const left = multiply(multiply(e1, e2), e4);
  const right = multiply(e1, multiply(e2, e4));
  expect(left.loads[parseSignature(4, "e_111")]).toBe(1n);
  expect(right.loads[parseSignature(4, "-e_111")]).toBe(1n);
  expect(left).not.toEqual(right);
  expect(coordinates(left)).toEqual(big(0, 0, 0, 0, 0, 0, 0, 1));
  expect(coordinates(right)).toEqual(big(0, 0, 0, 0, 0, 0, 0, -1));
  expect(coordinates(left)).not.toEqual(coordinates(right));
  expect(coordinates(left, true)).toEqual(big(0, 0, 0, 0, 0, 0, 0, 1));
  expect(coordinates(left, true)).toEqual(coordinates(right, true));
});
