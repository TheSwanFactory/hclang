/**
 * Independent host oracle for the 017.11 classical Cayley–Dickson lane.
 *
 * Host mathematics, written separately from the HC lane and never reading HC
 * output. Where HC builds each sign table from signed monomials and lookup
 * trees, this module multiplies dense integer coefficient vectors, labels
 * points by integers (bit d of a label is its newest sheet bit), computes rank
 * by Gaussian elimination on bit masks, and finds graph components by
 * breadth-first search.
 *
 * Convention (Dickson/Schafer): (a, b)(c, d) = (ac − conj(d) b, d a + b conj(c))
 * on halves of a dense vector, with conj(a, b) = (conj a, −b).
 *
 * @module
 */

/** A doubling law: Dickson/Schafer, Baez, and the two sign-error mutants. */
export type Law = "DS" | "B" | "Ma" | "Mb";

/** A sign table w_d, stored row-major: `w[a * 2^d + c]`. */
export type Table = Uint8Array;

/** A dense product on coefficient vectors of one fixed length. */
export type Mul = (x: number[], y: number[]) => number[];

const add = (x: number[], y: number[]): number[] => x.map((v, i) => v + y[i]);
const sub = (x: number[], y: number[]): number[] => x.map((v, i) => v - y[i]);
const neg = (x: number[]): number[] => x.map((v) => -v);

/** Recursive conjugation: conj(a, b) = (conj a, −b); reals are fixed. */
export function conj(x: number[]): number[] {
  if (x.length === 1) return [x[0]];
  const h = x.length / 2;
  return [...conj(x.slice(0, h)), ...neg(x.slice(h))];
}

/** One doubling step of `law`, given a product on the halves. */
export function doubleWith(
  x: number[],
  y: number[],
  law: Law,
  mul: Mul,
  cj: (v: number[]) => number[],
): number[] {
  const h = x.length / 2;
  const a = x.slice(0, h), b = x.slice(h);
  const c = y.slice(0, h), d = y.slice(h);
  switch (law) {
    case "DS":
      return [
        ...sub(mul(a, c), mul(cj(d), b)),
        ...add(mul(d, a), mul(b, cj(c))),
      ];
    case "B":
      return [
        ...sub(mul(a, c), mul(d, cj(b))),
        ...add(mul(cj(a), d), mul(c, b)),
      ];
    case "Ma":
      return [
        ...add(mul(a, c), mul(cj(d), b)),
        ...add(mul(d, a), mul(b, cj(c))),
      ];
    case "Mb":
      return [...sub(mul(a, c), mul(d, b)), ...add(mul(d, a), mul(b, c))];
  }
}

/** The pure recursive Cayley–Dickson product of two dense vectors. */
export function cdMul(x: number[], y: number[], law: Law = "DS"): number[] {
  if (x.length === 1) return [x[0] * y[0]];
  return doubleWith(x, y, law, (u, v) => cdMul(u, v, law), conj);
}

/** The basis vector e_i of dimension n. */
export function basis(n: number, i: number): number[] {
  const v = new Array(n).fill(0);
  v[i] = 1;
  return v;
}

/** Reads a sign table off basis products, asserting each is ±e_(a xor c). */
export function tableFromMul(d: number, mul: Mul): Table {
  const n = 1 << d;
  const w = new Uint8Array(n * n);
  for (let a = 0; a < n; a++) {
    for (let c = 0; c < n; c++) {
      const p = mul(basis(n, a), basis(n, c));
      const nz = p.flatMap((v, i) => (v === 0 ? [] : [i]));
      if (nz.length !== 1 || nz[0] !== (a ^ c) || Math.abs(p[a ^ c]) !== 1) {
        throw new Error(`e_${a} e_${c} is not ±e_${a ^ c}`);
      }
      w[a * n + c] = p[a ^ c] < 0 ? 1 : 0;
    }
  }
  return w;
}

/** The classical sign table of dimension 2^d by pure dense recursion. */
export function signTable(d: number, law: Law = "DS"): Table {
  return tableFromMul(d, (x, y) => cdMul(x, y, law));
}

/** The dense product defined by an arbitrary sign table. */
export function tableMul(w: Table, d: number): Mul {
  const n = 1 << d;
  return (x, y) => {
    const out = new Array(n).fill(0);
    for (let i = 0; i < n; i++) {
      if (x[i] === 0) continue;
      for (let j = 0; j < n; j++) {
        if (y[j] === 0) continue;
        out[i ^ j] += (w[i * n + j] ? -1 : 1) * x[i] * y[j];
      }
    }
    return out;
  };
}

/** Conjugation with the frozen convention conj(e_b) = (−1)^ν(b) e_b. */
export function conjNu(x: number[]): number[] {
  return x.map((v, i) => (i === 0 ? v : -v));
}

/**
 * The literal doubling of an arbitrary floor-d table: dense vectors, lower
 * product from the table, conjugation by ν. Not assumed to stay in 𝒲.
 */
export function literalCD(w: Table, d: number, law: Law = "DS"): Table {
  const lower = tableMul(w, d);
  return tableFromMul(d + 1, (x, y) => doubleWith(x, y, law, lower, conjNu));
}

/** ν(x) = [x ≠ 0]. */
export const nu = (x: number): number => (x !== 0 ? 1 : 0);

/** δν(a, c) = ν(a) ⊕ ν(c) ⊕ ν(a ⊕ c). */
export const dnu = (a: number, c: number): number => nu(a) ^ nu(c) ^ nu(a ^ c);

/** Rank of a set of bit-mask vectors over F2, by Gaussian elimination. */
export function rankF2(vs: number[]): number {
  const rows = [...vs];
  let rank = 0;
  for (let bit = 30; bit >= 0; bit--) {
    const i = rows.findIndex((r) => (r >> bit) & 1);
    if (i < 0) continue;
    const pivot = rows.splice(i, 1)[0];
    for (let k = 0; k < rows.length; k++) {
      if ((rows[k] >> bit) & 1) rows[k] ^= pivot;
    }
    rank++;
  }
  return rank;
}

/** The closed form Lift(w) ⊕ Pν at floor d + 1. */
export function closedCD(w: Table, d: number): Table {
  const n = 1 << d, m = 2 * n;
  const u = new Uint8Array(m * m);
  for (let A = 0; A < m; A++) {
    for (let C = 0; C < m; C++) {
      const a = A & (n - 1), al = A >> d, c = C & (n - 1), ga = C >> d;
      u[A * m + C] = w[a * n + c] ^ (ga & dnu(a, c)) ^ (al & nu(c)) ^ (al & ga);
    }
  }
  return u;
}

/** The four-corner curvature K(w)(a, c; s). */
export function curvature(
  w: Table,
  d: number,
  a: number,
  c: number,
  s: number,
): number {
  const n = 1 << d;
  const at = (x: number, y: number) => w[x * n + y];
  return at(a, c) ^ at(a ^ s, c) ^ at(a, c ^ s) ^ at(a ^ s, c ^ s);
}

/** S(K(w)) at floor d + 1, from the floor-d table only. */
export function sCurvature(
  w: Table,
  d: number,
  A: number,
  C: number,
  S: number,
): number {
  const n = 1 << d;
  const a = A & (n - 1), c = C & (n - 1), s = S & (n - 1), sg = S >> d;
  const j = sg & ((s === 0 ? 1 : 0) ^ (rankF2([a, c, s]) === 3 ? 1 : 0));
  return curvature(w, d, a, c, s) ^ j;
}

/** Fixed-width binary label, newest (most significant) bit first. */
export const bits = (x: number, d: number): string =>
  d === 0 ? "" : x.toString(2).padStart(d, "0");

/** Membership in 𝒲(d): diagonal failures, transpose failures, first failure. */
export function inW(w: Table, d: number): [number, number, string] {
  const n = 1 << d;
  let diag = 0, trans = 0;
  let first = "none";
  for (let a = 0; a < n; a++) {
    for (let c = 0; c < n; c++) {
      const t = w[c * n + a] ^ w[a * n + c] ^ dnu(a, c);
      const g = a === c ? w[a * n + a] ^ nu(a) : 0;
      if (a === c) diag += g;
      trans += t;
      if (first === "none" && (t || g)) {
        const kind = t && g ? "both" : t ? "transpose" : "diagonal";
        first = `${kind}:${bits(a, d)}:${bits(c, d)}`;
      }
    }
  }
  return [diag, trans, first];
}

/** Row-major table text. */
export function tabStr(w: Table): string {
  return Array.from(w).join("");
}

/** K over (a, c, s), row-major. */
export function kStr(w: Table, d: number): string {
  const n = 1 << d;
  let out = "";
  for (let a = 0; a < n; a++) {
    for (let c = 0; c < n; c++) {
      for (let s = 0; s < n; s++) out += curvature(w, d, a, c, s);
    }
  }
  return out;
}

/** Number of K = 1 triples. */
export function kOnes(w: Table, d: number): number {
  return [...kStr(w, d)].filter((ch) => ch === "1").length;
}

/** A matched square: direction s and coset representatives a < a⊕s, c < c⊕s. */
export interface Square {
  s: number;
  a: number;
  c: number;
}

/** Every square of floor d, in (s, a, c) label order. */
export function allSquares(d: number): Square[] {
  const n = 1 << d;
  const out: Square[] = [];
  for (let s = 1; s < n; s++) {
    for (let a = 0; a < n; a++) {
      if (a > (a ^ s)) continue;
      for (let c = 0; c < n; c++) {
        if (c > (c ^ s) || a === c) continue;
        out.push({ s, a, c });
      }
    }
  }
  return out;
}

/** The positive squares (K = 0) of a table. */
export function positiveSquares(w: Table, d: number): Square[] {
  return allSquares(d).filter((q) => curvature(w, d, q.a, q.c, q.s) === 0);
}

/** T02's lower-half data (s′, a, c) and whether it is an ordered basis. */
export function lowData(
  q: Square,
  d: number,
): [string, string, string, number] {
  const top = 1 << (d - 1);
  if (!(q.s & top) || q.a & top || q.c & top) return ["na", "na", "na", -1];
  const lo = top - 1;
  const r = rankF2([q.s & lo, q.a, q.c]) === 3 ? 1 : 0;
  return [bits(q.s & lo, d - 1), bits(q.a, d - 1), bits(q.c, d - 1), r];
}

/** A two-term element e_p + (−1)^e e_q with p < q. */
export interface Two {
  p: number;
  q: number;
  e: number;
}

/** String form p±q, matching the HC spelling. */
export const xStr = (x: Two, d: number): string =>
  `${bits(x.p, d)}${x.e ? "-" : "+"}${bits(x.q, d)}`;

const vecOf = (x: Two, n: number): number[] => {
  const v = new Array(n).fill(0);
  v[x.p] = 1;
  v[x.q] = x.e ? -1 : 1;
  return v;
};

/** Everything the HC two-term search reports, recomputed by dense products. */
export interface TwoTerm {
  X: Two[];
  pairs: [Two, Two][];
  yxZero: number;
  edges: [Two, Two][];
  verts: Two[];
  degree: (x: Two) => number;
  supports: [number, number][];
  suppEdges: [[number, number], [number, number]][];
  components: [number, number][][];
}

const sameTwo = (x: Two, y: Two) => x.p === y.p && x.q === y.q && x.e === y.e;
const ltTwo = (x: Two, y: Two) =>
  x.p !== y.p ? x.p < y.p : x.q !== y.q ? x.q < y.q : x.e < y.e;

/** The exhaustive two-term annihilation search with a given dense product. */
export function twoTerm(d: number, mul: Mul): TwoTerm {
  const n = 1 << d;
  const X: Two[] = [];
  for (let p = 0; p < n; p++) {
    for (let q = p + 1; q < n; q++) X.push({ p, q, e: 0 }, { p, q, e: 1 });
  }
  const zero = (x: Two, y: Two) =>
    mul(vecOf(x, n), vecOf(y, n)).every((v) => v === 0);
  const pairs: [Two, Two][] = [];
  for (const x of X) for (const y of X) if (zero(x, y)) pairs.push([x, y]);
  const yxZero = pairs.filter(([x, y]) => zero(y, x)).length;
  const has = (x: Two, y: Two) =>
    pairs.some(([u, v]) => sameTwo(u, x) && sameTwo(v, y));
  const edges: [Two, Two][] = [];
  for (const [x, y] of pairs) {
    if (ltTwo(x, y)) edges.push([x, y]);
    else if (!has(y, x)) edges.push([y, x]);
  }
  const degree = (x: Two) =>
    edges.filter(([u, v]) => sameTwo(u, x) || sameTwo(v, x)).length;
  const verts = X.filter((x) => degree(x) > 0);
  const supports: [number, number][] = [];
  for (const x of verts) {
    if (!supports.some(([p, q]) => p === x.p && q === x.q)) {
      supports.push([x.p, x.q]);
    }
  }
  supports.sort((u, v) => u[0] !== v[0] ? u[0] - v[0] : u[1] - v[1]);
  const key = (u: [number, number]) => u[0] * n + u[1];
  const adj = new Map<number, Set<number>>();
  for (const [x, y] of edges) {
    const u = key([x.p, x.q]), v = key([y.p, y.q]);
    if (!adj.has(u)) adj.set(u, new Set());
    if (!adj.has(v)) adj.set(v, new Set());
    adj.get(u)!.add(v);
    adj.get(v)!.add(u);
  }
  const suppEdges: [[number, number], [number, number]][] = [];
  for (const u of supports) {
    for (const v of supports) {
      if (key(u) < key(v) && adj.get(key(u))?.has(key(v))) {
        suppEdges.push([u, v]);
      }
    }
  }
  const seen = new Set<number>();
  const components: [number, number][][] = [];
  for (const u of supports) {
    if (seen.has(key(u))) continue;
    const comp = new Set<number>([key(u)]);
    const queue = [key(u)];
    while (queue.length) {
      const k = queue.shift()!;
      for (const v of adj.get(k) ?? []) {
        if (!comp.has(v)) {
          comp.add(v);
          queue.push(v);
        }
      }
    }
    comp.forEach((k) => seen.add(k));
    components.push(supports.filter((s) => comp.has(key(s))));
  }
  return {
    X,
    pairs,
    yxZero,
    edges,
    verts,
    degree,
    supports,
    suppEdges,
    components,
  };
}

/** The four signed terms of xy under a table, in HC's term order. */
export function terms(w: Table, d: number, x: Two, y: Two): [number, number][] {
  const n = 1 << d;
  const at = (i: number, j: number) => w[i * n + j];
  return [
    [x.p ^ y.p, at(x.p, y.p)],
    [x.p ^ y.q, y.e ^ at(x.p, y.q)],
    [x.q ^ y.p, x.e ^ at(x.q, y.p)],
    [x.q ^ y.q, x.e ^ y.e ^ at(x.q, y.q)],
  ];
}

/** The closure-factory four-block formula, as a separately stated route. */
export function fourBlockCD(w: Table, d: number): Table {
  const n = 1 << d, m = 2 * n;
  const u = new Uint8Array(m * m);
  for (let A = 0; A < m; A++) {
    for (let C = 0; C < m; C++) {
      const a = A & (n - 1), al = A >> d, c = C & (n - 1), ga = C >> d;
      const wac = w[a * n + c], wca = w[c * n + a];
      u[A * m + C] = al === 0
        ? (ga === 0 ? wac : wca)
        : ga === 0
        ? wac ^ nu(c)
        : 1 ^ nu(c) ^ wca;
    }
  }
  return u;
}

/** Flip one entry of a table. */
export function poke(w: Table, d: number, a: number, c: number): Table {
  const u = new Uint8Array(w);
  u[a * (1 << d) + c] ^= 1;
  return u;
}
