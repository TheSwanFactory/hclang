/**
 * Compares what HC printed with what the independent host oracle computes.
 *
 * For every HC variant the oracle builds the records HC should have printed,
 * from its own dense arithmetic, and the two lists are compared field by field
 * under each `tag|first-field` key. Missing, extra and differing records are
 * all reported; nothing is thrown away. The closure probe (C6) is compared the
 * same way, but its disagreements are observations about the runtime, not
 * failures of the lane.
 *
 * @module
 */

import { type Field, type HcRecord, parseRecords } from "./parse.ts";
import {
  allSquares,
  bits,
  cdMul,
  closedCD,
  curvature,
  fourBlockCD,
  inW,
  kOnes,
  kStr,
  type Law,
  literalCD,
  lowData,
  poke,
  positiveSquares,
  rankF2,
  sCurvature,
  signTable,
  type Square,
  type Table,
  tableMul,
  tabStr,
  terms,
  type Two,
  type TwoTerm,
  twoTerm,
  xStr,
} from "./oracle.ts";

/** One expected record. */
export type Rec = { tag: string; fields: Field[] };

const rec = (tag: string, ...fields: Field[]): Rec => ({ tag, fields });

/** floorrec: size, table, 𝒲 membership, K = 1 count. */
export function floorRec(lane: string, d: number, w: Table): Rec {
  const [dg, tr, first] = inW(w, d);
  return rec("floor", lane, d, 1 << d, tabStr(w), dg, tr, first, kOnes(w, d));
}

/** steprec: doubling vs closed form, product shape, K(CD w) vs S(K w). */
export function stepRec(
  lane: string,
  d: number,
  lower: Table,
  upper: Table,
): Rec {
  const m = 2 << d;
  const closed = closedCD(lower, d);
  let pd = 0, pdFirst = "none";
  for (let A = 0; A < m; A++) {
    for (let C = 0; C < m; C++) {
      if (upper[A * m + C] !== closed[A * m + C]) {
        if (pd === 0) pdFirst = `${bits(A, d + 1)}:${bits(C, d + 1)}`;
        pd++;
      }
    }
  }
  let kd = 0, kdFirst = "none";
  for (let A = 0; A < m; A++) {
    for (let C = 0; C < m; C++) {
      for (let S = 0; S < m; S++) {
        if (
          curvature(upper, d + 1, A, C, S) !== sCurvature(lower, d, A, C, S)
        ) {
          if (kd === 0) {
            kdFirst = `${bits(A, d + 1)}:${bits(C, d + 1)}:${bits(S, d + 1)}`;
          }
          kd++;
        }
      }
    }
  }
  // literalCD asserts every product is one signed basis element at A ⊕ C.
  return rec(
    "step",
    lane,
    d,
    pd,
    m * m,
    pdFirst,
    0,
    m * m,
    "none",
    kd,
    m * m * m,
    kdFirst,
  );
}

/** The square census of one floor. */
export function squaresRec(lane: string, d: number, w: Table): Rec {
  const all = allSquares(d);
  const pos = positiveSquares(w, d);
  const unord = pos.filter((q) => q.a < q.c).length;
  const swap = pos.filter((q) => curvature(w, d, q.c, q.a, q.s) === 0).length;
  return rec("squares", lane, d, all.length, pos.length, unord, swap);
}

function squareRec(lane: string, w: Table, d: number, q: Square): Rec {
  const n = 1 << d;
  const at = (x: number, y: number) => w[x * n + y];
  const ld = lowData(q, d);
  return rec(
    "square",
    lane,
    bits(q.s, d),
    bits(q.a, d),
    bits(q.a ^ q.s, d),
    bits(q.c, d),
    bits(q.c ^ q.s, d),
    at(q.a, q.c),
    at(q.a ^ q.s, q.c),
    at(q.a, q.c ^ q.s),
    at(q.a ^ q.s, q.c ^ q.s),
    curvature(w, d, q.a, q.c, q.s),
    ...ld,
  );
}

function lowDataRec(lane: string, w: Table, d: number): Rec {
  const pos = positiveSquares(w, d);
  const basisSq = allSquares(d).filter((q) => lowData(q, d)[3] === 1);
  const key = (q: Square) => lowData(q, d).join(",");
  let same = 0;
  for (const p of pos) for (const q of pos) if (key(p) === key(q)) same++;
  const lo = 1 << (d - 1);
  let nb = 0;
  for (let a = 0; a < lo; a++) {
    for (let c = 0; c < lo; c++) {
      for (let s = 0; s < lo; s++) if (rankF2([s, a, c]) === 3) nb++;
    }
  }
  return rec(
    "sq-lowdata",
    lane,
    pos.filter((q) => lowData(q, d)[3] === 1).length,
    basisSq.length,
    basisSq.filter((q) => curvature(w, d, q.a, q.c, q.s) === 1).length,
    same,
    nb,
  );
}

function twoTermRec(lane: string, d: number, w: Table, t: TwoTerm): Rec {
  const sumZero = t.pairs.filter(([x, y]) => {
    const m = terms(w, d, x, y);
    return m.every(([l]) =>
      m.filter(([k]) => k === l).reduce((s, [, b]) => s + (b ? -1 : 1), 0) === 0
    );
  }).length;
  const degSum = t.verts.reduce((s, x) => s + t.degree(x), 0);
  return rec(
    "twoterm-summary",
    lane,
    d,
    t.X.length,
    t.pairs.length,
    t.yxZero,
    sumZero,
    t.edges.length,
    t.verts.length,
    degSum,
    t.supports.length,
    t.suppEdges.length,
    t.components.length,
  );
}

const sp = (u: [number, number], d: number) =>
  `${bits(u[0], d)}:${bits(u[1], d)}`;

function incidenceRecs(lane: string, d: number, w: Table, t: TwoTerm): Rec[] {
  const n = 1 << d;
  const at = (i: number, j: number) => w[i * n + j];
  const out: Rec[] = [];
  const mulZero = (x: Two, y: Two) =>
    t.pairs.some(([u, v]) => u === x && v === y);
  for (const [x, y] of t.pairs) {
    const dm = (x.p ^ x.q) === (y.p ^ y.q) ? 1 : 0;
    const eh = x.e ^ y.e;
    const pr = 1 ^ at(x.p, y.p) ^ at(x.q, y.q);
    out.push(
      rec(
        "annpair",
        lane,
        xStr(x, d),
        xStr(y, d),
        bits(x.p ^ x.q, d),
        bits(y.p ^ y.q, d),
        dm,
        eh,
        pr,
        eh === pr ? 1 : 0,
        mulZero(y, x) ? 1 : 0,
      ),
    );
  }
  for (const [x, y] of t.edges) {
    out.push(rec("edge", lane, xStr(x, d), xStr(y, d)));
  }
  for (const x of t.verts) {
    out.push(rec("zd-vertex", lane, xStr(x, d), t.degree(x)));
  }
  for (const u of t.supports) {
    out.push(
      rec("support", lane, bits(u[0], d), bits(u[1], d), bits(u[0] ^ u[1], d)),
    );
  }
  for (const [u, v] of t.suppEdges) {
    out.push(rec("support-edge", lane, sp(u, d), sp(v, d)));
  }
  const lo = (1 << (d - 1)) - 1;
  for (const c of t.components) {
    const inC = (u: [number, number]) =>
      c.some((v) => v[0] === u[0] && v[1] === u[1]);
    const ne = t.suppEdges.filter(([u, v]) => inC(u) && inC(v)).length;
    const lows = [...new Set(c.map(([p, q]) => (p ^ q) & lo))].sort((a, b) =>
      a - b
    );
    const tops = [...new Set(c.map(([p, q]) => (p ^ q) >> (d - 1)))].sort((
      a,
      b,
    ) => a - b);
    out.push(
      rec(
        "component",
        lane,
        c.length,
        ne,
        lows.map((v) => bits(v, d - 1) + "/").join(""),
        tops.map((v) => `${v}/`).join(""),
        c.map((u) => sp(u, d) + "/").join(""),
      ),
    );
  }
  const unord = positiveSquares(w, d).filter((q) => q.a < q.c);
  const onSq = (q: Square, x: Two, y: Two) => {
    const L = [q.a, q.a ^ q.s], R = [q.c, q.c ^ q.s];
    const is = (z: Two, S: number[]) => z.p === S[0] && z.q === S[1];
    return (is(x, L) && is(y, R)) || (is(x, R) && is(y, L));
  };
  for (const q of unord) {
    const k = t.edges.filter(([x, y]) => onSq(q, x, y)).length;
    out.push(
      rec("sq-edges", lane, bits(q.s, d), bits(q.a, d), bits(q.c, d), k),
    );
  }
  const off =
    t.edges.filter(([x, y]) => !unord.some((q) => onSq(q, x, y))).length;
  out.push(rec("edges-off-squares", lane, off));
  for (const [x, y] of t.pairs.slice(0, 3)) {
    const m = terms(w, d, x, y);
    const sum = (l: number) =>
      m.filter(([k]) => k === l).reduce((s, [, b]) => s + (b ? -1 : 1), 0);
    out.push(
      rec(
        "witness",
        lane,
        xStr(x, d),
        xStr(y, d),
        m.map(([l, b]) => `${bits(l, d)}:${b ? -1 : 1}/`).join(""),
        m.map(([l]) => `${bits(l, d)}:${sum(l)}/`).join(""),
        m.every(([l]) => sum(l) === 0) ? 1 : 0,
      ),
    );
  }
  return out;
}

/** Classical tables by pure dense recursion, independent of every table route. */
export function classical(law: Law = "DS"): Table[] {
  return [0, 1, 2, 3, 4].map((d) => signTable(d, law));
}

/** Iterates the literal doubling of an arbitrary seed with a law. */
export function lane(seed: Table, d0: number, d1: number, law: Law): Table[] {
  const out: Table[] = [];
  out[d0] = seed;
  for (let d = d0; d < d1; d++) out[d + 1] = literalCD(out[d], d, law);
  return out;
}

/** Everything main.hc should print, as computed by the oracle. */
export function expectMain(): Rec[] {
  const w = classical("DS");
  // Cross-route check inside the oracle: literal doubling of its own tables.
  const lit = lane(w[0], 0, 4, "DS");
  for (let d = 0; d <= 4; d++) {
    if (tabStr(lit[d]) !== tabStr(w[d])) {
      throw new Error(`oracle routes disagree at ${d}`);
    }
  }
  const out: Rec[] = [
    rec(
      "enum",
      4,
      Array.from({ length: 16 }, (_, i) => bits(i, 4) + "/").join(""),
    ),
  ];
  for (let d = 0; d <= 4; d++) out.push(floorRec("DS", d, w[d]));
  for (let d = 0; d < 4; d++) out.push(stepRec("DS", d, w[d], w[d + 1]));
  for (let d = 1; d <= 4; d++) out.push(rec("table-K", "DS", d, kStr(w[d], d)));
  for (let d = 1; d <= 4; d++) out.push(squaresRec("DS", d, w[d]));
  for (const q of positiveSquares(w[4], 4)) {
    out.push(squareRec("DS", w[4], 4, q));
  }
  out.push(lowDataRec("DS", w[4], 4));
  for (let d = 1; d <= 4; d++) {
    // Pure dense recursion again, not the table, for the products themselves.
    const t = twoTerm(d, (x, y) => cdMul(x, y, "DS"));
    out.push(twoTermRec("DS", d, w[d], t));
    if (d === 4) out.push(...incidenceRecs("DS", d, w[d], t));
  }
  return out;
}

/** Everything controls.hc should print, as computed by the oracle. */
export function expectControls(): Rec[] {
  const w = classical("DS");
  const out: Rec[] = [];
  // C1: r = 0 on F2^2, literally doubled.
  const r2 = new Uint8Array(16);
  const r3 = literalCD(r2, 2, "DS");
  out.push(
    floorRec("C1-r0", 2, r2),
    floorRec("C1-r0", 3, r3),
    stepRec("C1-r0", 2, r2, r3),
  );
  // C2: Baez by pure dense recursion with the Baez law.
  const b = classical("B");
  for (let d = 1; d <= 4; d++) out.push(floorRec("B", d, b[d]));
  for (let d = 0; d < 4; d++) out.push(stepRec("B", d, b[d], b[d + 1]));
  for (let d = 1; d <= 4; d++) {
    const n = 1 << d;
    let tr = 0;
    for (let a = 0; a < n; a++) {
      for (let c = 0; c < n; c++) tr += b[d][a * n + c] ^ w[d][c * n + a];
    }
    let kd = 0;
    for (let a = 0; a < n; a++) {
      for (let c = 0; c < n; c++) {
        for (let s = 0; s < n; s++) {
          kd += curvature(b[d], d, a, c, s) ^ curvature(w[d], d, a, c, s);
        }
      }
    }
    out.push(rec("baez-vs-ds", d, tr, kd));
  }
  out.push(squaresRec("B", 4, b[4]));
  // C3: mutants, iterated literally from w(0) = 0.
  for (const law of ["Ma", "Mb"] as Law[]) {
    const m = lane(new Uint8Array(1), 0, 4, law);
    for (let d = 1; d <= 4; d++) out.push(floorRec(law, d, m[d]));
    for (let d = 0; d < 4; d++) out.push(stepRec(law, d, m[d], m[d + 1]));
  }
  // C4: flip w3 at (3, 5) and double.
  const x3 = poke(w[3], 3, 3, 5);
  const x4 = literalCD(x3, 3, "DS");
  out.push(floorRec("C4-poke", 3, x3), floorRec("C4-poke", 4, x4));
  const diff: string[] = [];
  for (let A = 0; A < 16; A++) {
    for (let C = 0; C < 16; C++) {
      if (w[4][A * 16 + C] !== x4[A * 16 + C]) {
        diff.push(`${bits(A, 4)}:${bits(C, 4)}/`);
      }
    }
  }
  out.push(rec("poke-diff", "C4-poke", diff.length, diff.join("")));
  // C5: w2' = w2 ⊕ f, f = 1 on (1, 2) and (2, 1).
  const a2 = poke(poke(w[2], 2, 1, 2), 2, 2, 1);
  const alt = lane(a2, 2, 4, "DS");
  for (let d = 2; d <= 4; d++) out.push(floorRec("C5-alt", d, alt[d]));
  for (let d = 2; d < 4; d++) {
    out.push(stepRec("C5-alt", d, alt[d], alt[d + 1]));
  }
  for (let d = 3; d <= 4; d++) out.push(squaresRec("C5-alt", d, alt[d]));
  for (let d = 3; d <= 4; d++) {
    out.push(twoTermRec("C5-alt", d, alt[d], twoTerm(d, tableMul(alt[d], d))));
  }
  return out;
}

/** What closure-probe.hc would print on a runtime with lexical closures. */
export function expectClosure(): Rec[] {
  const w = classical("DS");
  const out: Rec[] = [];
  for (const tag of ["Mk", "MkN"]) {
    let t: Table = new Uint8Array(1);
    for (let d = 1; d <= 4; d++) {
      t = fourBlockCD(t, d - 1);
      out.push(rec("closure-table", tag, d, tabStr(t)));
    }
  }
  // The four-block formula must itself agree with the classical tables.
  for (let d = 1; d <= 4; d++) {
    if (tabStr(fourBlockCD(w[d - 1], d - 1)) !== tabStr(w[d])) {
      throw new Error(`four-block route wrong at ${d}`);
    }
  }
  out.push(rec("p5-depth", 1, 2, 3));
  return out;
}

/** One comparison outcome. */
export interface Comparison {
  variant: string;
  key: string;
  index: number;
  pass: boolean;
  expected: Field[] | null;
  actual: Field[] | null;
  differingFields: number[];
  gate: boolean;
}

const keyOf = (r: Rec | HcRecord) => `${r.tag}|${r.fields[0]}`;

function group(rs: (Rec | HcRecord)[]): Map<string, Field[][]> {
  const m = new Map<string, Field[][]>();
  for (const r of rs) {
    if (r.tag === "clock") continue;
    const k = keyOf(r);
    if (!m.has(k)) m.set(k, []);
    m.get(k)!.push(r.fields);
  }
  return m;
}

/** Compares the HC records with the oracle's, key by key and field by field. */
export function compareRecords(
  variant: string,
  hc: HcRecord[],
  expected: Rec[],
  gate: boolean,
): Comparison[] {
  const a = group(hc), e = group(expected);
  const keys = [...new Set([...e.keys(), ...a.keys()])];
  const out: Comparison[] = [];
  for (const k of keys) {
    const el = e.get(k) ?? [], al = a.get(k) ?? [];
    for (let i = 0; i < Math.max(el.length, al.length); i++) {
      const ex = el[i] ?? null, ac = al[i] ?? null;
      const diff: number[] = [];
      if (ex && ac) {
        for (let j = 0; j < Math.max(ex.length, ac.length); j++) {
          if (ex[j] !== ac[j]) diff.push(j);
        }
      }
      out.push({
        variant,
        key: k,
        index: i,
        pass: !!ex && !!ac && diff.length === 0,
        expected: ex,
        actual: ac,
        differingFields: diff,
        gate,
      });
    }
  }
  return out;
}

/** Counts differing characters between two equal-length table strings. */
export function charDiff(x: string, y: string): number {
  let n = Math.abs(x.length - y.length);
  for (let i = 0; i < Math.min(x.length, y.length); i++) if (x[i] !== y[i]) n++;
  return n;
}

/** The expected records of a variant. */
export function expectedFor(variant: string): Rec[] {
  if (variant === "main") return expectMain();
  if (variant === "controls") return expectControls();
  if (variant === "closure-probe") return expectClosure();
  throw new Error(`unknown variant ${variant}`);
}

/** Field names of the summary records quoted in observations.json. */
export const SCHEMA: Record<string, string[]> = {
  floor: [
    "lane",
    "d",
    "points",
    "table",
    "diagonalFails",
    "transposeFails",
    "firstWFailure",
    "kOnes",
  ],
  step: [
    "lane",
    "fromFloor",
    "cdVsClosedDisagree",
    "pairs",
    "firstCdVsClosed",
    "nonMonomialProducts",
    "products",
    "firstBadProduct",
    "kcdVsSkDisagree",
    "triples",
    "firstKcdVsSk",
  ],
  squares: [
    "lane",
    "d",
    "squares",
    "orderedPositive",
    "unorderedPositive",
    "orderedWithPositiveSwap",
  ],
  "sq-lowdata": [
    "lane",
    "positiveWithBasisLowData",
    "squaresWithBasisLowData",
    "basisSquaresThatAreNegative",
    "positivePairsWithEqualLowData",
    "orderedBasesOfV3",
  ],
  "twoterm-summary": [
    "lane",
    "d",
    "twoTermElements",
    "orderedAnnihilatingPairs",
    "ofThemAlsoYxZero",
    "ofThemLabelSumZero",
    "unorderedEdges",
    "zeroDivisorVertices",
    "degreeSum",
    "supports",
    "supportEdges",
    "supportComponents",
  ],
  component: [
    "lane",
    "supports",
    "supportEdges",
    "lowDisplacements",
    "topDisplacementBits",
    "members",
  ],
  "edges-off-squares": ["lane", "edgesOnNoPositiveSquare"],
  "poke-diff": ["lane", "changedEntries", "entries"],
  "baez-vs-ds": ["d", "notTranspose", "curvatureDiffers"],
  "closure-table": ["factory", "d", "table"],
  "p5-depth": ["depth1", "depth2", "depth3"],
};

const named = (tag: string, fields: Field[], author: string) => {
  const names = SCHEMA[tag];
  const o: Record<string, Field> = { tag, author };
  fields.forEach((f, i) => (o[names[i] ?? `f${i}`] = f));
  if (tag === "floor") delete o.table;
  return o;
};

/** HC-computed summaries beside the oracle's, each labelled by author. */
export function observations(
  outputs: Record<string, string>,
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  const w = classical("DS");
  for (const [variant, text] of Object.entries(outputs)) {
    const hc = parseRecords(text).filter((r) => r.tag in SCHEMA);
    const ex = expectedFor(variant).filter((r) => r.tag in SCHEMA);
    const extra: Record<string, unknown>[] = [];
    if (variant === "closure-probe") {
      for (const r of hc.filter((x) => x.tag === "closure-table")) {
        const d = Number(r.fields[1]);
        extra.push({
          author: "host (comparison)",
          factory: r.fields[0],
          d,
          charsDifferingFromDataRoute: charDiff(
            String(r.fields[2]),
            tabStr(w[d]),
          ),
        });
      }
    }
    out[variant] = {
      hc: hc.map((r) => named(r.tag, r.fields, "HC")),
      oracle: ex.map((r) => named(r.tag, r.fields, "host-oracle")),
      ...(extra.length ? { comparisons: extra } : {}),
    };
  }
  return out;
}

/** Parses one variant's output and compares it. Closure-probe is not a gate. */
export function compareVariant(variant: string, text: string): Comparison[] {
  return compareRecords(
    variant,
    parseRecords(text),
    expectedFor(variant),
    variant !== "closure-probe",
  );
}
