import { expect } from "jsr:@std/expect@^0.219.1";
import {
  add,
  addDenum,
  arity,
  CD,
  cd,
  cdRank,
  conjugate,
  coordinates,
  denum as denumState,
  DenumError,
  denumText,
  fromHost,
  isCD,
  isCDArity,
  isEmpty,
  MAX_RANK,
  multiply,
  observe,
  observesZero,
  opposite,
  parseSignature,
  promote,
  rankOf,
  rankOfArity,
  residual,
  schemaOf,
  signatureName,
  subtract,
  zero,
} from "./denum.ts";

/**
 * Test constructor of a CD rung: checks `loads.length === arity(rank)` and
 * builds the explicit CD, so a test names the rung it means without the
 * state storing it.
 */
function denum(rank: number, count: bigint, loads: readonly bigint[]): CD {
  expect(loads.length).toBe(arity(rank));
  return cd(count, loads);
}

/**
 * Independent oracle: the standard Cayley–Dickson doubling over integer
 * vectors. Test-only, so the shipped module has exactly one multiplier.
 */
function vectorMultiply(a: bigint[], b: bigint[]): bigint[] {
  if (a.length === 1) return [a[0] * b[0]];
  const half = a.length / 2;
  const [p, q] = [a.slice(0, half), a.slice(half)];
  const [r, s] = [b.slice(0, half), b.slice(half)];
  const conj = (v: bigint[]): bigint[] =>
    v.length === 1 ? [v[0]] : [
      ...conj(v.slice(0, v.length / 2)),
      ...v.slice(v.length / 2).map((c) => -c),
    ];
  const sum = (u: bigint[], v: bigint[]) => u.map((c, i) => c + v[i]);
  const diff = (u: bigint[], v: bigint[]) => u.map((c, i) => c - v[i]);
  // (p,q)(r,s) = (pr − s̄q, sp + qr̄)
  return [
    ...diff(vectorMultiply(p, r), vectorMultiply(conj(s), q)),
    ...sum(vectorMultiply(s, p), vectorMultiply(q, conj(r))),
  ];
}

/** A Denum of `rank` carrying the given loads by native signature name. */
function make(rank: number, loads: Record<string, bigint>, count = 1n): CD {
  const channels = Array<bigint>(arity(rank)).fill(0n);
  for (const [name, load] of Object.entries(loads)) {
    channels[parseSignature(rank, name)] = load;
  }
  return denum(rank, count, channels);
}

/** The single signature of a one-channel product, by name. */
function only(source: CD): string {
  const present = source.loads
    .map((load, channel) => ({ load, channel }))
    .filter(({ load }) => load !== 0n);
  expect(present.length).toBe(1);
  expect(present[0].load).toBe(1n);
  return signatureName(rankOf(source), present[0].channel);
}

const unit = (rank: number, name: string): CD => make(rank, { [name]: 1n });

Deno.test("native signature spelling follows 007.32b, no sign bit", () => {
  const names = (rank: number) =>
    Array.from({ length: arity(rank) }, (_, c) => signatureName(rank, c));
  expect(names(0)).toEqual(["e_ε"]);
  expect(names(1)).toEqual(["e_ε", "-e_ε"].map((n) => n.replace("ε", "ε")));
  expect(names(2)).toEqual(["e_0", "e_1", "-e_0", "-e_1"]);
  expect(names(3)).toEqual([
    "e_00",
    "e_01",
    "e_10",
    "e_11",
    "-e_00",
    "-e_01",
    "-e_10",
    "-e_11",
  ]);
  expect(arity(4)).toBe(16);
  expect(arity(5)).toBe(32);
  expect(signatureName(5, 31)).toBe("-e_1111");
  expect(parseSignature(3, "-e_10")).toBe(6);
  for (let rank = 0; rank <= MAX_RANK; rank++) {
    for (let c = 0; c < arity(rank); c++) {
      expect(parseSignature(rank, signatureName(rank, c))).toBe(c);
    }
  }
});

Deno.test("malformed signatures and ranks are refused", () => {
  const kind = (fn: () => unknown) => {
    try {
      fn();
    } catch (error) {
      return (error as DenumError).kind;
    }
    return "no error";
  };
  expect(kind(() => parseSignature(2, "e_01"))).toBe("$!.denum-signature");
  expect(kind(() => parseSignature(2, "e_ε"))).toBe("$!.denum-signature");
  expect(kind(() => parseSignature(0, "-e_ε"))).toBe("$!.denum-signature");
  expect(kind(() => parseSignature(1, "e_0"))).toBe("$!.denum-signature");
  expect(kind(() => parseSignature(3, "+e_01"))).toBe("$!.denum-signature");
  expect(kind(() => arity(6))).toBe("$!.denum-rank");
  expect(kind(() => arity(-1))).toBe("$!.denum-rank");
  expect(kind(() => denumState(0n, []))).toBe("$!!.invalid-denum");
  expect(kind(() => denumState(-1n, [0n, 0n]))).toBe("$!!.invalid-denum");
  expect(kind(() => denumState(0n, [0n, -1n]))).toBe("$!!.invalid-denum");
});

Deno.test("witness 1: D0 Size and D1 pairwise sign algebra", () => {
  const a = denum(0, 2n, [3n]);
  const b = denum(0, 5n, [4n]);
  expect(add(a, b)).toEqual(denum(0, 7n, [7n]));
  expect(multiply(a, b)).toEqual(denum(0, 10n, [12n]));
  const minus = unit(1, "-e_ε");
  const plus = unit(1, "e_ε");
  expect(only(multiply(minus, minus))).toBe("e_ε");
  expect(only(multiply(minus, plus))).toBe("-e_ε");
  expect(only(multiply(plus, minus))).toBe("-e_ε");
  expect(only(multiply(plus, plus))).toBe("e_ε");
  // Loads stay nonnegative and multiply: (2·(-1))·(3·(-1)) = 6 on +1.
  const m = make(1, { "-e_ε": 2n });
  const n = make(1, { "-e_ε": 3n });
  expect(multiply(m, n).loads).toEqual([6n, 0n]);
});

Deno.test("witness 2: D2 e_1·e_1 = -e_0 and J⁴ = 1 under observation", () => {
  const j = unit(2, "e_1");
  const j2 = multiply(j, j);
  expect(only(j2)).toBe("-e_0");
  const j4 = multiply(j2, j2);
  expect(only(j4)).toBe("e_0");
  expect(observe(j4)).toEqual([1n, 0n]);
  expect(observe(j2)).toEqual([-1n, 0n]);
});

Deno.test("witness 3: D3 J·I = K and I·J = -K", () => {
  expect(only(multiply(unit(3, "e_01"), unit(3, "e_10")))).toBe("e_11");
  expect(only(multiply(unit(3, "e_10"), unit(3, "e_01")))).toBe("-e_11");
});

Deno.test("witness 4: D4 octonion associator, indices checked", () => {
  const e = (name: string) => unit(4, name);
  const left = multiply(multiply(e("e_001"), e("e_010")), e("e_100"));
  const right = multiply(e("e_001"), multiply(e("e_010"), e("e_100")));
  expect(only(left)).toBe("e_111");
  expect(only(right)).toBe("-e_111");
  // Independent: the vector doubling agrees, and the associator is nonzero.
  const v = (index: number) => {
    const basis = Array<bigint>(8).fill(0n);
    basis[index] = 1n;
    return basis;
  };
  const vl = vectorMultiply(vectorMultiply(v(1), v(2)), v(4));
  const vr = vectorMultiply(v(1), vectorMultiply(v(2), v(4)));
  expect(vl[7]).toBe(1n);
  expect(vr[7]).toBe(-1n);
});

Deno.test("witness 5: D5 observed sedenion zero divisors, product nonempty", () => {
  const x = make(5, { "e_0001": 1n, "e_1010": 1n });
  const y = make(5, { "e_0100": 1n, "-e_1111": 1n });
  expect(observesZero(x)).toBe(false);
  expect(observesZero(y)).toBe(false);
  const product = multiply(x, y);
  expect(observesZero(product)).toBe(true);
  expect(isEmpty(product)).toBe(false);
  expect(observe(product)).toEqual(Array(16).fill(0n));
  // Both factors, as integer vectors, multiply to zero in the standard doubling.
  const vx = observe(x);
  const vy = observe(y);
  expect(vectorMultiply(vx, vy)).toEqual(Array(16).fill(0n));
});

Deno.test("witness 6: exhaustive basis pairs against vector CD doubling", () => {
  for (let rank = 1; rank <= MAX_RANK; rank++) {
    const size = arity(rank) / 2;
    for (let i = 0; i < arity(rank); i++) {
      for (let j = 0; j < arity(rank); j++) {
        const x = zero(rank);
        const y = zero(rank);
        const xl = [...x.loads];
        const yl = [...y.loads];
        xl[i] = 1n;
        yl[j] = 1n;
        const product = multiply(denum(rank, 1n, xl), denum(rank, 1n, yl));
        // Loads are nonnegative and exactly one channel carries the 1.
        expect(product.loads.filter((w) => w !== 0n)).toEqual([1n]);
        const vector = vectorMultiply(
          observe(denum(rank, 1n, xl)),
          observe(denum(rank, 1n, yl)),
        );
        expect(observe(product)).toEqual(vector);
        expect(size).toBe(vector.length);
      }
    }
  }
});

function pseudo(seed: number): () => bigint {
  let state = seed;
  return () => {
    state = (state * 1103515245 + 12345) & 0x7fffffff;
    return BigInt((state >> 16) % 4);
  };
}

function random(rank: number, next: () => bigint, count: bigint): CD {
  return denum(rank, count, Array.from({ length: arity(rank) }, next));
}

Deno.test("witness 6b: observer is multiplicative and additive", () => {
  const next = pseudo(7);
  for (let rank = 1; rank <= MAX_RANK; rank++) {
    for (let trial = 0; trial < 6; trial++) {
      const x = random(rank, next, 2n);
      const y = random(rank, next, 3n);
      expect(observe(multiply(x, y))).toEqual(
        vectorMultiply(observe(x), observe(y)),
      );
      expect(observe(add(x, opposite(y)))).toEqual(
        observe(x).map((c, i) => c - observe(y)[i]),
      );
      expect(observe(subtract(x, y))).toEqual(
        observe(x).map((c, i) => c - observe(y)[i]),
      );
      expect(observe(opposite(x))).toEqual(observe(x).map((c) => -c));
      // Conjugation: direction 0 fixed, the rest negated.
      expect(observe(conjugate(x))).toEqual(
        observe(x).map((c, i) => (i === 0 ? c : -c)),
      );
      // Anti-involution: conj(xy) = conj(y) conj(x) under observation.
      expect(observe(conjugate(multiply(x, y)))).toEqual(
        observe(multiply(conjugate(y), conjugate(x))),
      );
    }
  }
});

Deno.test("witness 6c: nonassociative parenthesization is preserved", () => {
  const next = pseudo(11);
  const x = random(4, next, 1n);
  const y = random(4, next, 1n);
  const z = random(4, next, 1n);
  const left = multiply(multiply(x, y), z);
  const right = multiply(x, multiply(y, z));
  expect(observe(left)).toEqual(
    vectorMultiply(vectorMultiply(observe(x), observe(y)), observe(z)),
  );
  expect(observe(right)).toEqual(
    vectorMultiply(observe(x), vectorMultiply(observe(y), observe(z))),
  );
  expect(observe(left)).not.toEqual(observe(right));
  // Associative through D3 (quaternions).
  const q = [3, 3, 3].map(() => random(3, next, 1n));
  expect(observe(multiply(multiply(q[0], q[1]), q[2]))).toEqual(
    observe(multiply(q[0], multiply(q[1], q[2]))),
  );
});

Deno.test("witness 7: promotion is path independent and loses nothing", () => {
  const next = pseudo(3);
  for (let from = 0; from <= MAX_RANK; from++) {
    const x = random(from, next, 9n);
    for (let to = from; to <= MAX_RANK; to++) {
      const direct = promote(x, to);
      expect(direct.count).toBe(9n);
      expect(direct.loads.reduce((a, b) => a + b, 0n)).toBe(
        x.loads.reduce((a, b) => a + b, 0n),
      );
      for (let mid = from; mid <= to; mid++) {
        expect(promote(promote(x, mid), to)).toEqual(direct);
      }
    }
  }
  // Promotion does not mutate the source.
  const source = denum(1, 4n, [2n, 1n]);
  promote(source, 5);
  expect(source).toEqual(denum(1, 4n, [2n, 1n]));
  // Named maps: D1 -e_ε → D2 -e_0 → D3 -e_00.
  expect(only(promote(unit(1, "-e_ε"), 2))).toBe("-e_0");
  expect(only(promote(unit(2, "e_1"), 3))).toBe("e_01");
  expect(only(promote(unit(2, "-e_1"), 3))).toBe("-e_01");
  expect(only(promote(unit(0, "e_ε"), 1))).toBe("e_ε");
  expect(promote(denum(0, 0n, [5n]), 1).loads).toEqual([5n, 0n]);
});

Deno.test("witness 7b: promotion commutes with the operations", () => {
  const next = pseudo(5);
  for (let r = 1; r < MAX_RANK; r++) {
    const x = random(r, next, 2n);
    const y = random(r, next, 5n);
    for (let to = r + 1; to <= MAX_RANK; to++) {
      expect(promote(add(x, y), to)).toEqual(
        add(promote(x, to), promote(y, to)),
      );
      expect(promote(multiply(x, y), to)).toEqual(
        multiply(promote(x, to), promote(y, to)),
      );
      expect(promote(opposite(x), to)).toEqual(opposite(promote(x, to)));
      expect(promote(conjugate(x), to)).toEqual(conjugate(promote(x, to)));
    }
  }
});

Deno.test("witness 7c: mixed-rank products promote to the larger rank", () => {
  const next = pseudo(13);
  const d2 = random(2, next, 2n);
  const d3 = random(3, next, 3n);
  const d5 = random(5, next, 4n);
  const mixed = multiply(d2, d3);
  expect(rankOf(mixed)).toBe(3);
  expect(mixed).toEqual(multiply(promote(d2, 3), d3));
  expect(rankOf(multiply(d3, d5))).toBe(5);
  expect(observe(multiply(d3, d5))).toEqual(
    vectorMultiply(observe(promote(d3, 5)), observe(d5)),
  );
  expect(rankOf(add(d2, d3))).toBe(3);
  expect(add(d2, d3).count).toBe(5n);
  // Order is kept across ranks.
  expect(observe(multiply(d3, d2))).toEqual(
    vectorMultiply(observe(d3), observe(promote(d2, 3))),
  );
});

Deno.test("Count laws: add, multiply, opposite, promotion", () => {
  const x = denum(2, 3n, [1n, 0n, 0n, 2n]);
  const y = denum(2, 4n, [0n, 5n, 1n, 0n]);
  expect(add(x, y).count).toBe(7n);
  expect(multiply(x, y).count).toBe(12n);
  expect(opposite(x).count).toBe(3n);
  expect(conjugate(x).count).toBe(3n);
  expect(promote(x, 5).count).toBe(3n);
  // Count zero with a nonzero load is a state; loads do not determine Count.
  const odd = denum(2, 0n, [3n, 0n, 0n, 0n]);
  expect(odd.count).toBe(0n);
  expect(multiply(odd, y).count).toBe(0n);
  expect(isEmpty(multiply(odd, y))).toBe(false);
  // Multiplying loads is independent of Count.
  expect(multiply(odd, y).loads).toEqual(
    multiply(denum(2, 1n, odd.loads), y).loads,
  );
});

Deno.test("boundaries: empty host, explicit zero D0, balanced D1, zero-size", () => {
  // An explicit zero-load D0 is present and empty.
  const present = zero(0, 0n);
  expect(isEmpty(present)).toBe(true);
  expect(present.loads.length).toBe(1);
  // A nonempty D1 with opposite equal loads observes zero but is not empty.
  const balanced = denum(1, 2n, [3n, 3n]);
  expect(observesZero(balanced)).toBe(true);
  expect(isEmpty(balanced)).toBe(false);
  // X + Opp(X) is present and nonempty though it observes zero.
  const x = denum(2, 1n, [2n, 1n, 0n, 0n]);
  const sum = add(x, opposite(x));
  expect(observesZero(sum)).toBe(true);
  expect(isEmpty(sum)).toBe(false);
  expect(sum.count).toBe(2n);
  // D0 opposite promotes to D1 first.
  expect(opposite(denum(0, 1n, [4n]))).toEqual(denum(1, 1n, [0n, 4n]));
  // Zero-size application counts and loads nothing.
  expect(fromHost(1, 3n, 0n, 0n)).toEqual(denum(1, 3n, [0n, 0n]));
  expect(fromHost(0, 3n, 0n, 0n)).toEqual(denum(0, 3n, [0n]));
  // Conjugation at D0 is the identity, and D1 scalars are fixed.
  expect(conjugate(denum(0, 1n, [4n]))).toEqual(denum(0, 1n, [4n]));
  expect(conjugate(denum(1, 1n, [4n, 2n]))).toEqual(denum(1, 1n, [4n, 2n]));
  expect(conjugate(denum(2, 1n, [1n, 2n, 3n, 4n]))).toEqual(
    denum(2, 1n, [1n, 4n, 3n, 2n]),
  );
});

Deno.test("host construction: fromHost agrees with the Demi derivation", () => {
  // Count 3, Size 8, residual 2: loads (8+2)/2 = 5 and (8-2)/2 = 3.
  expect(fromHost(1, 3n, 8n, 2n)).toEqual(denum(1, 3n, [5n, 3n]));
  // Higher ranks fill the same two real channels and zero elsewhere.
  expect(fromHost(2, 3n, 8n, 2n)).toEqual(denum(2, 3n, [5n, 0n, 3n, 0n]));
  expect(fromHost(2, 3n, 8n, 2n)).toEqual(promote(fromHost(1, 3n, 8n, 2n), 2));
  expect(fromHost(5, 3n, 8n, 2n).loads.filter((w) => w !== 0n)).toEqual([
    5n,
    3n,
  ]);
  const failure = (fn: () => unknown) => {
    try {
      fn();
    } catch (error) {
      return (error as DenumError).kind;
    }
  };
  expect(failure(() => fromHost(1, 1n, 3n, 0n))).toBe("$!.denum-coherence");
  expect(failure(() => fromHost(1, 1n, 1n, 3n))).toBe("$!.denum-coherence");
});

Deno.test("text shows schema, Count and loads separately", () => {
  expect(denumText(denum(2, 7n, [3n, 2n, 0n, 1n]))).toBe(
    "CD[2](C=7, W=[3, 2, 0, 1])",
  );
  expect(denumText(denumState(7n, [3n, 2n, 0n, 1n]))).toBe(
    "Denum(Arity[4], C=7, W=[3, 2, 0, 1])",
  );
});

Deno.test("results are fresh: no operation returns its argument or aliases its loads", () => {
  const sources = [0, 1, 2, 3].map((rank) =>
    denum(
      rank,
      3n,
      Array.from({ length: arity(rank) }, (_, i) => BigInt(i + 1)),
    )
  );
  for (const source of sources) {
    const before = [...source.loads];
    const results = [
      promote(source, rankOf(source)),
      conjugate(source),
      opposite(source),
      add(source, zero(rankOf(source))),
      multiply(source, make(rankOf(source), {})),
    ];
    for (const result of results) {
      expect(result).not.toBe(source);
      expect(result.loads).not.toBe(source.loads);
      // Mutating a returned carrier must not reach the original.
      (result.loads as bigint[]).fill(99n);
      expect(source.loads).toEqual(before);
    }
  }
  // Same-rank promotion and D0 conjugation equal their argument, but are copies.
  const d0 = denum(0, 2n, [5n]);
  expect(conjugate(d0)).toEqual(d0);
  expect(promote(d0, 0)).toEqual(d0);
});

const kindOf = (fn: () => unknown): string => {
  try {
    fn();
  } catch (error) {
    return (error as DenumError).kind;
  }
  return "no error";
};

Deno.test("rank is exactly ⌊log₂ A⌋ of the load count, by integers", () => {
  const expected: Record<number, number> = {
    1: 0,
    2: 1,
    3: 1,
    4: 2,
    5: 2,
    6: 2,
    7: 2,
    8: 3,
    16: 4,
    32: 5,
    33: 5,
    64: 6,
  };
  for (const [a, rank] of Object.entries(expected)) {
    expect(rankOfArity(Number(a))).toBe(rank);
  }
  // Every threshold and its neighbours agree with the definition.
  for (let n = 0; n < 30; n++) {
    expect(rankOfArity(2 ** n)).toBe(n);
    expect(rankOfArity(2 ** (n + 1) - 1)).toBe(n);
  }
  expect(kindOf(() => rankOfArity(0))).toBe("$!!.invalid-denum");
  expect(kindOf(() => rankOfArity(-2))).toBe("$!!.invalid-denum");
  expect(kindOf(() => rankOfArity(2.5))).toBe("$!!.invalid-denum");
});

Deno.test("rank reads the load list, never the Count or the Size", () => {
  for (const a of [1, 2, 3, 4, 5, 6, 7, 8, 16, 32, 33, 64]) {
    const zeros = denumState(0n, Array(a).fill(0n));
    const loaded = denumState(10n ** 9n, Array(a).fill(7n));
    const odd = denumState(3n, Array.from({ length: a }, (_, i) => BigInt(i)));
    expect(rankOf(zeros)).toBe(rankOfArity(a));
    expect(rankOf(loaded)).toBe(rankOfArity(a));
    expect(rankOf(odd)).toBe(rankOfArity(a));
  }
  // The state has no rank slot at all.
  expect(Object.keys(denumState(7n, [3n, 2n, 1n])).sort()).toEqual([
    "count",
    "loads",
  ]);
});

Deno.test("Denum [7, [3, 2, 1]] is a three-channel Denum of rank 1", () => {
  const d = denumState(7n, [3n, 2n, 1n]);
  expect(d.count).toBe(7n);
  expect(d.loads).toEqual([3n, 2n, 1n]);
  expect(d.loads.reduce((a, b) => a + b, 0n)).toBe(6n);
  expect(rankOf(d)).toBe(1);
  expect(schemaOf(d)).toBe("Arity[3]");
  expect(denumText(d)).toBe("Denum(Arity[3], C=7, W=[3, 2, 1])");
  // Count may be zero over nonzero loads, and nonzero over zero loads.
  expect(denumState(0n, [4n, 0n, 0n]).count).toBe(0n);
  expect(denumState(5n, [0n, 0n, 0n]).loads).toEqual([0n, 0n, 0n]);
  // Freshness: the loads are copied.
  const loads = [1n, 2n, 3n];
  const copy = denumState(1n, loads);
  loads[0] = 9n;
  expect(copy.loads).toEqual([1n, 2n, 3n]);
  expect(kindOf(() => denumState(1n, []))).toBe("$!!.invalid-denum");
});

Deno.test("CD eligibility is explicit construction on a shipped arity", () => {
  for (const a of [1, 2, 4, 8, 16, 32]) {
    expect(isCDArity(a)).toBe(true);
    const built = cd(0n, Array(a).fill(0n));
    expect(isCD(built)).toBe(true);
    expect(CD.is(built)).toBe(true);
    expect(schemaOf(built)).toBe(`CD[${rankOfArity(a)}]`);
    expect(cdRank(built)).toBe(rankOfArity(a));
    // A generic Denum of the same arity is not a CD and keeps `Arity[A]`.
    const generic = denumState(0n, Array(a).fill(0n));
    expect(isCD(generic)).toBe(false);
    expect(schemaOf(generic)).toBe(`Arity[${a}]`);
    expect(kindOf(() => cdRank(generic))).toBe("$!.denum-not-cd");
  }
  for (const a of [3, 5, 6, 7, 9, 12, 33, 64, 128]) {
    expect(isCDArity(a)).toBe(false);
    expect(kindOf(() => cd(1n, Array(a).fill(1n)))).toBe(
      "$!.denum-unsupported-arity",
    );
    // The generic constructor accepts every positive arity.
    const d = denumState(1n, Array(a).fill(1n));
    expect(isCD(d)).toBe(false);
    expect(schemaOf(d)).toBe(`Arity[${a}]`);
  }
  // Malformed states are still the shared invalid-denum failure.
  expect(kindOf(() => cd(1n, []))).toBe("$!!.invalid-denum");
  expect(kindOf(() => cd(-1n, [0n, 0n]))).toBe("$!!.invalid-denum");
  expect(kindOf(() => cd(0n, [0n, -1n]))).toBe("$!!.invalid-denum");
  expect(kindOf(() => cd(0n, [0n, 1.5 as unknown as bigint]))).toBe(
    "$!!.invalid-denum",
  );
});

Deno.test("equal shape, different constructors: Denum [7,[3,2,1,4]] versus CD", () => {
  const generic = denumState(7n, [3n, 2n, 1n, 4n]);
  const explicit = cd(7n, [3n, 2n, 1n, 4n]);
  for (const d of [generic, explicit]) {
    expect(d.loads.length).toBe(4);
    expect(rankOf(d)).toBe(2);
    expect(d.count).toBe(7n);
    expect(d.loads.reduce((a, b) => a + b, 0n)).toBe(10n);
  }
  expect(schemaOf(generic)).toBe("Arity[4]");
  expect(schemaOf(explicit)).toBe("CD[2]");
  expect(denumText(generic)).toBe("Denum(Arity[4], C=7, W=[3, 2, 1, 4])");
  expect(denumText(explicit)).toBe("CD[2](C=7, W=[3, 2, 1, 4])");
  expect(isCD(generic)).toBe(false);
  expect(isCD(explicit)).toBe(true);
  // The same data, but not the same value: the type is part of the identity.
  expect(Object.getPrototypeOf(generic)).not.toBe(
    Object.getPrototypeOf(explicit),
  );
  // The CD has the verified projections; the generic has no CD reading.
  expect(coordinates(explicit)).toEqual([2n, -2n]);
  expect(coordinates(explicit, true)).toEqual([4n, 6n]);
  for (
    const op of [
      () => coordinates(generic as unknown as CD),
      () => coordinates(generic as unknown as CD, true),
      () => observe(generic as unknown as CD),
      () => residual(generic as unknown as CD),
      () => opposite(generic as unknown as CD),
      () => conjugate(generic as unknown as CD),
      () => promote(generic as unknown as CD, 3),
      () => multiply(generic as unknown as CD, generic as unknown as CD),
      () => subtract(generic as unknown as CD, generic as unknown as CD),
      () => add(generic as unknown as CD, generic as unknown as CD),
    ]
  ) {
    expect(kindOf(op)).toBe("$!.denum-not-cd");
  }
});

Deno.test("generic addition: equal arity, componentwise, no cancellation", () => {
  // A = 3: odd arity.
  const a3 = denumState(7n, [3n, 2n, 1n]);
  const b3 = denumState(2n, [4n, 0n, 0n]);
  const s3 = addDenum(a3, b3);
  expect(s3.count).toBe(9n);
  expect(s3.loads).toEqual([7n, 2n, 1n]);
  expect(s3.loads.reduce((x, y) => x + y, 0n)).toBe(10n);
  expect(rankOf(s3)).toBe(1);
  expect(schemaOf(s3)).toBe("Arity[3]");
  expect(isCD(s3)).toBe(false);
  expect(s3).not.toBe(a3);
  expect(s3.loads).not.toBe(a3.loads);
  expect(a3.loads).toEqual([3n, 2n, 1n]);
  expect(b3.loads).toEqual([4n, 0n, 0n]);
  // A = 4: a power of two, still generic: no CD promotion, no sign cancellation.
  const a4 = denumState(7n, [3n, 2n, 1n, 4n]);
  const b4 = denumState(2n, [4n, 0n, 0n, 5n]);
  const s4 = addDenum(a4, b4);
  expect(s4.count).toBe(9n);
  expect(s4.loads).toEqual([7n, 2n, 1n, 9n]);
  expect(rankOf(s4)).toBe(2);
  expect(s4.loads.reduce((x, y) => x + y, 0n)).toBe(19n);
  expect(isCD(s4)).toBe(false);
  expect(schemaOf(s4)).toBe("Arity[4]");
  // Channels that a CD would read as opposites do not cancel or swap.
  expect(
    addDenum(denumState(1n, [2n, 0n, 1n, 0n]), denumState(1n, [0n, 3n, 0n, 2n]))
      .loads,
  ).toEqual([2n, 3n, 1n, 2n]);
  // Arity 1, and arities beyond the CD maximum, add too.
  expect(addDenum(denumState(1n, [2n]), denumState(2n, [5n]))).toEqual({
    count: 3n,
    loads: [7n],
  });
  expect(
    addDenum(
      denumState(0n, Array(64).fill(1n)),
      denumState(1n, Array(64).fill(2n)),
    )
      .loads,
  ).toEqual(Array(64).fill(3n));
  // Count is independent of the Size, and the sum's Count stays additive.
  expect(
    addDenum(denumState(0n, [5n, 5n, 5n]), denumState(0n, [0n, 0n, 0n])).count,
  )
    .toBe(0n);
});

Deno.test("generic addition refuses different arities and mixed operands", () => {
  const a3 = denumState(1n, [1n, 1n, 1n]);
  const a4 = denumState(1n, [1n, 1n, 1n, 1n]);
  expect(kindOf(() => addDenum(a3, a4))).toBe("$!.denum-arity-mismatch");
  expect(kindOf(() => addDenum(a4, a3))).toBe("$!.denum-arity-mismatch");
  expect(kindOf(() => addDenum(a3, denumState(1n, [1n])))).toBe(
    "$!.denum-arity-mismatch",
  );
  // A CD in either position, at equal arity, is never reinterpreted.
  const c4 = cd(1n, [1n, 1n, 1n, 1n]);
  expect(kindOf(() => addDenum(a4, c4))).toBe("$!.denum-mixed");
  expect(kindOf(() => addDenum(c4, a4))).toBe("$!.denum-mixed");
  expect(kindOf(() => addDenum(c4, c4))).toBe("$!.denum-not-generic");
  expect(kindOf(() => add(a4 as unknown as CD, c4))).toBe("$!.denum-mixed");
  expect(kindOf(() => add(c4, a4 as unknown as CD))).toBe("$!.denum-mixed");
  expect(kindOf(() => multiply(a4 as unknown as CD, c4))).toBe(
    "$!.denum-mixed",
  );
  expect(kindOf(() => subtract(c4, a4 as unknown as CD))).toBe(
    "$!.denum-mixed",
  );
  // The CD operands are untouched by the refusals.
  expect(c4.loads).toEqual([1n, 1n, 1n, 1n]);
});

Deno.test("anti-spoof: copying count and loads does not forge CD identity", () => {
  const real = cd(1n, [1n, 0n]);
  const lookalike = { count: 1n, loads: [1n, 0n] } as unknown as CD;
  expect(CD.is(real)).toBe(true);
  expect(CD.is(lookalike)).toBe(false);
  expect(CD.is(Object.create(CD.prototype))).toBe(false);
  expect(CD.is({ ...real })).toBe(false);
  expect(CD.is(structuredClone({ count: real.count, loads: real.loads }))).toBe(
    false,
  );
  expect(CD.is(denumState(1n, [1n, 0n]))).toBe(false);
  expect(CD.is(null)).toBe(false);
  expect(CD.is(undefined)).toBe(false);
  expect(CD.is("CD")).toBe(false);
  expect(isCD(lookalike)).toBe(false);
  expect(kindOf(() => add(lookalike, real))).toBe("$!.denum-mixed");
  expect(kindOf(() => add(lookalike, lookalike))).toBe("$!.denum-not-cd");
  expect(kindOf(() => multiply(real, lookalike))).toBe("$!.denum-mixed");
  expect(kindOf(() => promote(lookalike, 2))).toBe("$!.denum-not-cd");
  expect(kindOf(() => coordinates(lookalike))).toBe("$!.denum-not-cd");
  // Operations on a real CD answer real CDs, and a lookalike never becomes one.
  expect(CD.is(add(real, real))).toBe(true);
  expect(CD.is(multiply(real, real))).toBe(true);
  expect(CD.is(opposite(real))).toBe(true);
  expect(CD.is(conjugate(real))).toBe(true);
  expect(CD.is(promote(real, 3))).toBe(true);
  expect(CD.is(subtract(real, real))).toBe(true);
  expect(CD.is(fromHost(2, 3n, 8n, 2n))).toBe(true);
  expect(CD.is(zero(3))).toBe(true);
  expect(CD.is(addDenum(denumState(1n, [1n]), denumState(1n, [1n])))).toBe(
    false,
  );
});

Deno.test("fromHost and promote name the target rung; the rank is then derived", () => {
  for (let n = 0; n <= MAX_RANK; n++) {
    const built = fromHost(n, 3n, 6n, n === 0 ? 0n : 2n);
    expect(rankOf(built)).toBe(n);
    expect(built.loads.length).toBe(arity(n));
    expect(rankOf(promote(built, MAX_RANK))).toBe(MAX_RANK);
  }
  expect(kindOf(() => promote(zero(3), 2))).toBe("$!.denum-demotion");
  expect(kindOf(() => promote(zero(1), 6))).toBe("$!.denum-rank");
  expect(CD.is(fromHost(3, 1n, 2n, 0n))).toBe(true);
});
