/**
 * The 007.41 same-Denum experiment: both observer algebras on one bound Denum.
 *
 * `runExperiment()` answers a deterministic list of text lines. For every case
 * it builds a Denum, binds it with the real `d.#%` (twice: through the
 * TypeScript bridge and through a bare HC evaluator, and the two must agree),
 * reads the native `.#`, `.##` and `.###`, then reads the same loads through
 * the simplex quotient and, at C = 2ⁿ, the Cayley–Dickson algebra through the
 * isometry φ. Failures of compatibility are reported as measured, not
 * asserted away.
 *
 * Run it with `deno task experiment:observer-algebras`.
 *
 * @module
 */
import { bindWithBareSource, bindWithHC, type Bound } from "./bridge.ts";
import {
  BigIntRing,
  cdLeftAction,
  cdNormSquared,
  cdProduct,
  cdSupported,
  findBasisAssociatorWitness,
  findBasisNoncommutativeWitness,
  findNormCompositionFailure,
  findZeroDivisor,
  NumberRing,
} from "./cayley-dickson.ts";
import { ObserverDomainError, ratToString } from "./exact.ts";
import {
  compareProducts,
  maxDifference,
  normSquared,
  phi,
  phiNormSquaredExact,
} from "./isometry.ts";
import {
  simplexCanonical,
  simplexLeftAction,
  simplexProduct,
  simplexResultantSquared,
} from "./simplex.ts";

/** A Denum to feed through `d.#%`: `Denum [count, loads]`. */
export interface Case {
  readonly label: string;
  readonly count: bigint;
  readonly loads: readonly bigint[];
}

/** The deterministic cases, in the order they are reported. */
export const CASES: readonly Case[] = [
  { label: "C=0 boundary", count: 0n, loads: [2n, 5n] },
  { label: "C=1 degenerate", count: 1n, loads: [4n, 5n] },
  { label: "C=2 [3,1]", count: 2n, loads: [3n, 1n] },
  { label: "C=3 probe", count: 3n, loads: [2n, 5n, 3n, 7n, 4n] },
  { label: "C=4", count: 4n, loads: [1n, 2n, 3n, 4n, 5n, 6n] },
  {
    label: "C=8",
    count: 8n,
    loads: [3n, 1n, 4n, 1n, 5n, 9n, 2n, 6n, 5n, 3n, 5n],
  },
  {
    label: "C=16",
    count: 16n,
    loads: [
      3n,
      1n,
      4n,
      1n,
      5n,
      9n,
      2n,
      6n,
      5n,
      3n,
      5n,
      8n,
      9n,
      7n,
      9n,
      3n,
      2n,
      3n,
      8n,
      4n,
    ],
  },
  { label: "uniform C=2", count: 2n, loads: [5n, 5n] },
  { label: "uniform C=3", count: 3n, loads: [5n, 5n, 5n] },
  { label: "uniform C=4", count: 4n, loads: [5n, 5n, 5n, 5n] },
  {
    label: "uniform C=8",
    count: 8n,
    loads: [5n, 5n, 5n, 5n, 5n, 5n, 5n, 5n],
  },
];

/** Fixed-width double: six decimals, no negative zero. */
export function fx(x: number): string {
  const s = x.toFixed(6);
  return s === "-0.000000" ? "0.000000" : s;
}

const vec = (v: readonly number[]): string => `[${v.map(fx).join(", ")}]`;
const big = (v: readonly bigint[]): string => `[${v.join(", ")}]`;

/** Rotates left by one: a deterministic second operand with the same Size. */
function rotate(a: readonly bigint[]): bigint[] {
  return [...a.slice(1), ...a.slice(0, 1)];
}

/** The lines for one case. */
export function describeCase(c: Case): string[] {
  const lines: string[] = [];
  lines.push(`== ${c.label}: Denum [${c.count}, ${big(c.loads)}] .#%`);
  const viaBridge = bindWithHC(c.count, c.loads);
  const viaSource = bindWithBareSource(c.count, c.loads);
  if (!viaBridge.ok || !viaSource.ok) {
    const error = viaBridge.ok ? "bridge ok" : viaBridge.error;
    const sourceError = viaSource.ok ? "source ok" : viaSource.error;
    lines.push(`refused by .#%: bridge ${error}; bare source ${sourceError}`);
    lines.push("simplex: no algebra at Count 0");
    lines.push("cayley-dickson: no algebra at Count 0");
    return lines;
  }
  const b: Bound = viaBridge;
  const agree = b.text === viaSource.text;
  lines.push(`bound: ${b.text}; bridge and bare source agree: ${agree}`);
  lines.push(
    `native: .#=${b.count} .##=${b.size} .###=${b.residual} (alternating signed sum)`,
  );
  const count = Number(b.count);
  const loads = b.loads;

  // Algebra A — simplex.
  const r2 = simplexResultantSquared(loads);
  const canonical = simplexCanonical(loads);
  const square = simplexProduct(loads, loads);
  const other = rotate(loads);
  const product = simplexProduct(loads, other);
  lines.push(`simplex: class=${big(canonical)} R2=${ratToString(r2)}`);
  lines.push(
    `simplex: b*b=${big(square)} b*rot(b)=${big(product)} rot(b)*b=${
      big(simplexProduct(other, loads))
    }`,
  );
  const left = simplexLeftAction(loads);
  lines.push(
    `simplex: left action L_b is ${left.length}x${left.length}` +
      (left.length > 0 && left.length <= 3
        ? ` ${JSON.stringify(left.map((row) => row.map(String)))}`
        : ""),
  );

  // Algebra B — Cayley–Dickson.
  if (!cdSupported(count)) {
    try {
      cdProduct(BigIntRing, loads, loads);
    } catch (error) {
      if (!(error instanceof ObserverDomainError)) throw error;
      lines.push(`cayley-dickson: refused (${error.message})`);
    }
    return lines;
  }
  const x = phi(loads);
  const y = phi(other);
  const x2 = cdProduct(NumberRing, x, x);
  lines.push(`cayley-dickson: x=phi(b)=${vec(x)}`);
  lines.push(
    `cayley-dickson: N(x)=${fx(normSquared(x))} R2=${ratToString(r2)} exact N=${
      ratToString(phiNormSquaredExact(loads))
    }`,
  );
  lines.push(`cayley-dickson: x*x=${vec(x2)}`);
  const lx = cdLeftAction(NumberRing, 1, x);
  const lxx = lx.map((row) => row.reduce((s, v, j) => s + v * x[j], 0));
  lines.push(
    `cayley-dickson: left action L_x is ${lx.length}x${lx.length}, ` +
      `L_x(x) - x*x max gap ${maxDifference(lxx, x2).toExponential(1)}`,
  );
  const cmp = compareProducts(loads, loads);
  lines.push(
    `compare b*b: phi(b*_S b)=${
      vec(cmp.phiOfSimplexProduct)
    } phi(b)*_CD phi(b)=${vec(cmp.cdProductOfPhi)} gap=${
      fx(cmp.maxGap)
    } scalar=${fx(cmp.cdScalarPart)} homomorphic=${cmp.homomorphic}`,
  );
  const cross = compareProducts(loads, other);
  const xy = cdProduct(NumberRing, x, y);
  const yx = cdProduct(NumberRing, y, x);
  lines.push(
    `compare b*rot(b): gap=${fx(cross.maxGap)} scalar=${
      fx(cross.cdScalarPart)
    } homomorphic=${cross.homomorphic}; CD |xy-yx|^2=${
      fx(normSquared(xy.map((v, i) => v - yx[i])))
    }`,
  );
  return lines;
}

/** Law table for one supported dimension: successes, failures, witnesses. */
export function describeAlgebra(count: number): string {
  const assoc = findBasisAssociatorWitness(count);
  const comm = findBasisNoncommutativeWitness(count);
  const norm = findNormCompositionFailure(count);
  const zd = findZeroDivisor(count);
  const parts = [
    `associative=${assoc === undefined}${
      assoc ? ` witness(e${assoc.i},e${assoc.j},e${assoc.k})` : ""
    }`,
    `commutative=${comm === undefined}${
      comm ? ` witness(e${comm.i},e${comm.j})` : ""
    }`,
    `norm-composition(sparse family)=${norm === undefined}${
      norm
        ? ` witness x=${big(norm.x)} y=${
          big(norm.y)
        } N(xy)=${norm.normOfProduct} N(x)N(y)=${norm.productOfNorms}`
        : ""
    }`,
    "x" in zd
      ? `zero-divisor x=${big(zd.x)} y=${big(zd.y)} after ${zd.searched} pairs`
      : `zero-divisor none in ${zd.searched} sparse pairs`,
  ];
  const unit = Array.from({ length: count }, (_, i) => (i === 1 ? 1n : 0n));
  const sq = count > 1
    ? ` e1*e1=${big(cdProduct(BigIntRing, unit, unit))}`
    : "";
  return `CD C=${count}:${sq} N(e1)=${
    count > 1 ? cdNormSquared(BigIntRing, unit) : "n/a"
  } ${parts.join("; ")}`;
}

/** The whole report as lines. */
export function runExperiment(): string[] {
  const lines: string[] = [
    "# 007.41 simplex and Cayley-Dickson observer algebras (experimental)",
    "# convention: (a,b)(c,d) = (ac - conj(d)b, da + b conj(c)), conj(a,b) = (conj(a), -b)",
    "# phi: fixed-sign Helmert basis scaled by sqrt(C/(C-1)); index k carries row k",
  ];
  for (const c of CASES) lines.push(...describeCase(c));
  lines.push("== Cayley-Dickson laws by dimension");
  for (const c of [1, 2, 4, 8, 16]) lines.push(describeAlgebra(c));
  return lines;
}
