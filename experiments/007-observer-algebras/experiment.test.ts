import { expect } from "jsr:@std/expect@^0.219.1";
import { evaluate } from "../../lib/execute/evaluate.ts";
import {
  bindFromSource,
  bindingSource,
  bindWithBareSource,
  bindWithHC,
  observeFromSource,
} from "./bridge.ts";
import {
  BigIntRing as R,
  cdLeftAction,
  cdNormSquared,
  cdProduct,
  NumberRing as F,
} from "./cayley-dickson.ts";
import {
  ObserverDomainError,
  ratEqual,
  rational,
  ratToString,
} from "./exact.ts";
import { CASES, runExperiment } from "./experiment.ts";
import {
  compareProducts,
  maxDifference,
  nearlyEqual,
  normSquared,
  phi,
  phiNormSquaredExact,
  RELATIVE_TOLERANCE,
  resultantAsNumber,
} from "./isometry.ts";
import { sampleVectors } from "./sample.ts";
import {
  negacyclicProduct,
  simplexInner,
  simplexIsZero,
  simplexProduct,
  simplexResultantSquared,
} from "./simplex.ts";

/** Binds through the real `.#%` and demands success. */
function bound(count: bigint, loads: bigint[]): {
  count: bigint;
  loads: bigint[];
  size: bigint;
  residual: bigint;
} {
  const result = bindWithHC(count, loads);
  if (!result.ok) throw new Error(result.error);
  return result;
}

Deno.test("the bridge reads Count and loads from the real .#% and the two routes agree", () => {
  const viaBridge = bindWithHC(3n, [2n, 5n, 3n, 7n, 4n]);
  const viaSource = bindWithBareSource(3n, [2n, 5n, 3n, 7n, 4n]);
  expect(viaBridge).toEqual(viaSource);
  expect(viaBridge.ok && viaBridge.count).toEqual(3n);
  expect(viaBridge.ok && viaBridge.loads).toEqual([9n, 9n, 3n]);
  expect(viaBridge.ok && viaBridge.size).toEqual(21n);
  expect(viaBridge.ok && viaBridge.residual).toEqual(3n);
  // The source is a bare evaluator: no root and no host bindings.
  expect(bindingSource(3n, [2n, 5n])).toContain("(Denum [3, [2, 5]]).#%");
  // A bare `.####` Denum, bound without any import.
  const direct = bindFromSource("[5, 3, 7].####.#%");
  expect(direct.ok && direct.loads).toEqual([12n, 3n, 0n]);
});

Deno.test("the bridge routes agree on deterministic sample Denums, and match a test-side check of 007.39a", () => {
  for (const c of [1n, 3n, 4n, 8n]) {
    for (const sample of sampleVectors(7, 1, Number(c), 9)) {
      const loads = sample.map((v) => (v < 0n ? -v : v));
      const a = bindWithHC(c, loads);
      const b = bindWithBareSource(c, loads);
      expect(a).toEqual(b);
      // Independent check, in the test only, of what the shipped binding did.
      const expected = new Array<bigint>(Number(c)).fill(0n);
      loads.forEach((v, i) => expected[i % Number(c)] += v);
      expect(a.ok && a.loads).toEqual(expected);
    }
  }
});

Deno.test("the shipped binding refuses what the algebras must refuse", () => {
  const zero = bindWithHC(0n, [2n, 5n]);
  expect(zero).toEqual({ ok: false, error: "$!.denum-binding-zero-count" });
  expect(bindWithBareSource(0n, [2n, 5n])).toEqual(zero);
  expect(bindWithHC(70000n, [1n])).toEqual({
    ok: false,
    error: "$!.denum-binding-capacity",
  });
  expect(bindFromSource("[5, 3].#%")).toEqual({
    ok: false,
    error: "$!.denum-binding-receiver",
  });
});

Deno.test("C = 3 probe: Denum [3,[2,5,3,7,4]].#% is [9,9,3], Size 21, native residual 3, simplex R² = 36", () => {
  const b = bound(3n, [2n, 5n, 3n, 7n, 4n]);
  expect(b.loads).toEqual([9n, 9n, 3n]);
  expect(b.size).toEqual(21n);
  // Native `.###` is the alternating signed sum 9 − 9 + 3, a separate reading.
  expect(b.residual).toEqual(3n);
  expect(ratToString(simplexResultantSquared(b.loads))).toEqual("36");
  // |R| = 6 is neither Size 21 nor native residual 3.
  expect(36n).not.toEqual(b.residual * b.residual);
  expect(() => cdProduct(R, b.loads, b.loads)).toThrow(ObserverDomainError);
  expect(() => phi(b.loads)).toThrow(ObserverDomainError);
});

Deno.test("C = 2, weights [3,1]: simplex x = 2v0 with R² = 4 and x² = +4v0, but φ(x)² = −4·1", () => {
  const b = bound(2n, [3n, 1n]);
  expect(b.loads).toEqual([3n, 1n]);
  expect(simplexResultantSquared(b.loads)).toEqual({ num: 4n, den: 1n });
  expect(simplexProduct(b.loads, b.loads)).toEqual([4n, 0n]); // 4·v0
  const x = phi(b.loads);
  expect(x).toEqual([0, 2]); // +2i under the fixed Helmert sign
  expect(cdProduct(F, x, x)).toEqual([-4, 0]); // −4·1
  const cmp = compareProducts(b.loads, b.loads);
  expect(cmp.phiOfSimplexProduct).toEqual([0, 4]);
  expect(cmp.homomorphic).toBe(false);
  expect(cmp.maxGap).toEqual(4);
  expect(cmp.cdScalarPart).toEqual(-4);
});

Deno.test("φ is a linear isometry with N(φ(b)) = R²(b), exactly and numerically, at C = 1,2,4,8,16", () => {
  for (const c of [1, 2, 4, 8, 16]) {
    for (const loads of sampleVectors(c, 4, 31, 20)) {
      const a = loads.map((v) => v + 20n);
      const exact = phiNormSquaredExact(a);
      expect(ratEqual(exact, simplexResultantSquared(a)), `C=${c}`).toBe(true);
      expect(
        nearlyEqual(normSquared(phi(a)), resultantAsNumber(a)),
        `C=${c} ${normSquared(phi(a))} ${resultantAsNumber(a)}`,
      ).toBe(true);
      // Imaginary: the real part is exactly zero.
      expect(phi(a)[0]).toEqual(0);
      // Shift invariance: φ is a function of the class.
      const shifted = phi(a.map((v) => v + 13n));
      expect(maxDifference(shifted, phi(a))).toBeLessThan(1e-9);
    }
    // Polarization: φ preserves the bilinear metric.
    const [p, q] = sampleVectors(c, 2, 32, 15);
    const euclid = phi(p).reduce((s, v, i) => s + v * phi(q)[i], 0);
    const inner = simplexInner(p, q);
    expect(nearlyEqual(euclid, Number(inner.num) / Number(inner.den))).toBe(
      true,
    );
  }
  expect(RELATIVE_TOLERANCE).toEqual(1e-12);
});

Deno.test("C = 4: simplex multiplication commutes, CD does not; metrics match after φ but products do not", () => {
  const b = bound(4n, [1n, 2n, 3n, 4n, 5n, 6n]);
  expect(b.loads).toEqual([6n, 8n, 3n, 4n]);
  const rotated = [...b.loads.slice(1), b.loads[0]];
  expect(simplexProduct(b.loads, rotated)).toEqual(
    simplexProduct(rotated, b.loads),
  );
  const x = phi(b.loads);
  const y = phi(rotated);
  const xy = cdProduct(F, x, y);
  const yx = cdProduct(F, y, x);
  expect(maxDifference(xy, yx)).toBeGreaterThan(1);
  expect(nearlyEqual(normSquared(x), resultantAsNumber(b.loads))).toBe(true);
  const cmp = compareProducts(b.loads, rotated);
  expect(cmp.homomorphic).toBe(false);
  expect(cmp.maxGap).toBeGreaterThan(1);
  // Basis witness: quaternion units anticommute, simplex vertices commute.
  const e1 = [0n, 1n, 0n, 0n];
  const e2 = [0n, 0n, 1n, 0n];
  expect(cdProduct(R, e1, e2)).toEqual([0n, 0n, 0n, 1n]);
  expect(cdProduct(R, e2, e1)).toEqual([0n, 0n, 0n, -1n]);
});

Deno.test("C = 8 and 16: imaginary/scalar decomposition, x² = −N(x), left action equals the product, non-homomorphism recorded", () => {
  for (
    const [c, loads] of [
      [8n, [3n, 1n, 4n, 1n, 5n, 9n, 2n, 6n, 5n, 3n, 5n]],
      [16n, sampleVectors(20, 1, 33, 9)[0].map((v) => v + 9n)],
    ] as [bigint, bigint[]][]
  ) {
    const b = bound(c, loads);
    const x = phi(b.loads);
    const x2 = cdProduct(F, x, x);
    expect(x[0]).toEqual(0);
    expect(nearlyEqual(x2[0], -resultantAsNumber(b.loads))).toBe(true);
    expect(maxDifference(x2.slice(1), x2.slice(1).map(() => 0))).toBeLessThan(
      1e-9,
    );
    const lx = cdLeftAction(F, 1, x);
    const applied = lx.map((row) => row.reduce((s, v, j) => s + v * x[j], 0));
    expect(maxDifference(applied, x2)).toBeLessThan(1e-9);
    // φ(b·_S b) is imaginary (scalar 0) while φ(b)·φ(b) is the scalar −N(b).
    const cmp = compareProducts(b.loads, b.loads);
    expect(cmp.phiOfSimplexProduct[0]).toEqual(0);
    expect(nearlyEqual(cmp.cdScalarPart, -resultantAsNumber(b.loads))).toBe(
      true,
    );
    expect(cmp.homomorphic).toBe(false);
  }
});

Deno.test("uniform loads at C = 2,3,4,8 are the zero class; native residual is a separate reading", () => {
  for (const c of [2n, 3n, 4n, 8n]) {
    const b = bound(c, new Array<bigint>(Number(c)).fill(5n));
    expect(simplexIsZero(b.loads)).toBe(true);
    expect(ratToString(simplexResultantSquared(b.loads))).toEqual("0");
    // The native residual of uniform loads: 0 for even C, a full load for odd C.
    expect(b.residual).toEqual(c % 2n === 0n ? 0n : 5n);
    if (c !== 3n) {
      const x = phi(b.loads);
      expect(x.every((v) => v === 0)).toBe(true);
      expect(cdNormSquared(F, x)).toEqual(0);
    }
    // Contrast: in R[t]/(t^C+1) the all-ones vector is not annihilating.
    const oneMinusT = new Array<bigint>(Number(c)).fill(0n);
    oneMinusT[0] = 1n;
    oneMinusT[1] = -1n;
    expect(negacyclicProduct(b.loads.map(() => 1n), oneMinusT)[0]).toEqual(2n);
  }
});

Deno.test("boundaries: C = 0 is refused by .#% and by both algebras; C = 1 is the degenerate zero ring", () => {
  expect(bindWithHC(0n, [1n]).ok).toBe(false);
  expect(() => simplexProduct([], [])).toThrow(ObserverDomainError);
  expect(() => cdProduct(R, [], [])).toThrow(ObserverDomainError);
  const one = bound(1n, [4n, 5n]);
  expect(one.loads).toEqual([9n]);
  expect(one.size).toEqual(9n);
  expect(ratToString(simplexResultantSquared(one.loads))).toEqual("0");
  expect(simplexIsZero(one.loads)).toBe(true);
  expect(phi(one.loads)).toEqual([0]);
});

Deno.test("the experiment installs nothing: native Denum operators still behave as shipped", () => {
  // `*` is the Star shadow `scale_`; the experiment imports must not change it.
  expect(`${evaluate("[5, 3].#### * 2").at(-1)}`).toContain(
    "[.count 2; .loads [10, 6];",
  );
  expect(`${evaluate("[5, 3, 7].####.#%").at(-1)}`).toContain(
    ".loads [12, 3, 0]",
  );
});

Deno.test("the printed report equals the committed fixture", async () => {
  const report = runExperiment().join("\n") + "\n";
  const fixture = await Deno.readTextFile(
    new URL("./expected-output.txt", import.meta.url),
  );
  expect(report).toEqual(fixture);
  expect(CASES.length).toBeGreaterThan(8);
});

Deno.test("the native HC observers agree with the experiment's simplex, and read the signed basis for KDSL (007.43h, 007.44)", () => {
  // The native observers read Count as the rank, so each geometry is asked at
  // the rank whose wanted slot count is c: SSL r = c − 1, KPSL r = c/2, KDSL
  // r = log₂ c. The Helmert pure-imaginary map φ stays in the experiment only.
  for (const c of [1, 2, 3, 4, 5, 6, 8, 16]) {
    // Loads must be nonnegative; a uniform shift changes no simplex reading.
    for (const v of sampleVectors(c, 4, 4141)) {
      const loads = v.map((x) => x + 5n);
      const count = BigInt(c);
      const total = loads.reduce((a, b) => a + b, 0n);
      const simplex = observeFromSource(count - 1n, loads, ["##%", "###%"]);
      expect(`${simplex[0]}`).toEqual(
        ratToString(simplexResultantSquared(loads)),
      );
      // The centred coefficients bᵢ − S/C, reduced as the experiment does.
      expect(`${simplex[1]}`).toEqual(
        `[${
          loads.map((b) => ratToString(rational(count * b - total, count)))
            .join(", ")
        }]`,
      );
      if ((c & (c - 1)) === 0) {
        const rank = BigInt(Math.log2(c));
        const [size, residual] = observeFromSource(rank, loads, [
          "##%%%",
          "###%%%",
        ]);
        const n = Math.max(c / 2, 1);
        const r = c === 1
          ? [loads[0]]
          : loads.slice(0, n).map((b, i) => b - loads[i + n]);
        expect(`${residual}`).toEqual(`[${r.join(", ")}]`);
        expect(`${size}`).toEqual(`${r.reduce((a, b) => a + b * b, 0n)}`);
      }
      if (c % 2 === 0) {
        const n = c / 2;
        const r = loads.slice(0, n).map((b, i) => b - loads[i + n]);
        const [size, residual] = observeFromSource(count / 2n, loads, [
          "##%%",
          "###%%",
        ]);
        expect(`${residual}`).toEqual(`[${r.join(", ")}]`);
        expect(`${size}`).toEqual(`${r.reduce((a, b) => a + b * b, 0n)}`);
      }
    }
  }
});
