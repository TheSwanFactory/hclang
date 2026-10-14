import { expect } from "jsr:@std/expect@^0.219.1";
import { describe, it } from "jsr:@std/testing@^1.0.10/bdd";
import {
  basis,
  cdMul,
  closedCD,
  conj,
  curvature,
  fourBlockCD,
  inW,
  literalCD,
  poke,
  positiveSquares,
  rankF2,
  sCurvature,
  signTable,
  type Table,
  tableMul,
  twoTerm,
} from "./oracle.ts";
import {
  expectAltSeed,
  expectClosure,
  expectControls,
  expectMain,
} from "./compare.ts";

// These assertions test the oracle. The counts written here never reach HC.

const norm2 = (x: number[]) => cdMul(x, conj(x))[0];

function seeded(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 1103515245 + 12345) % 2147483648;
    return (s % 7) - 3;
  };
}

function kAgrees(w: Table, d: number, u: Table): boolean {
  const m = 2 << d;
  for (let A = 0; A < m; A++) {
    for (let C = 0; C < m; C++) {
      for (let S = 0; S < m; S++) {
        if (curvature(u, d + 1, A, C, S) !== sCurvature(w, d, A, C, S)) {
          return false;
        }
      }
    }
  }
  return true;
}

/** Every table on V_d that lies in 𝒲_d. */
function allLawful(d: number): Table[] {
  const n = 1 << d;
  const free: [number, number][] = [];
  for (let a = 0; a < n; a++) for (let c = a + 1; c < n; c++) free.push([a, c]);
  const out: Table[] = [];
  for (let mask = 0; mask < 1 << free.length; mask++) {
    const w = new Uint8Array(n * n);
    for (let b = 0; b < n; b++) w[b * n + b] = b ? 1 : 0;
    free.forEach(([a, c], i) => {
      const v = (mask >> i) & 1;
      w[a * n + c] = v;
      w[c * n + a] = v ^ ((a ? 1 : 0) ^ (c ? 1 : 0) ^ ((a ^ c) ? 1 : 0));
    });
    out.push(w);
  }
  return out;
}

describe("dense Cayley–Dickson oracle", () => {
  it("has a unit and anticommuting imaginary units up to the octonions", () => {
    for (let d = 1; d <= 3; d++) {
      const n = 1 << d, w = signTable(d);
      for (let a = 1; a < n; a++) {
        expect(w[a * n + a]).toBe(1);
        for (let c = 1; c < n; c++) {
          if (a !== c) expect(w[a * n + c] ^ w[c * n + a]).toBe(1);
        }
      }
    }
  });

  it("keeps the norm multiplicative at 8 and loses it at 16", () => {
    for (const [d, holds] of [[3, true], [4, false]] as const) {
      const n = 1 << d, r = seeded(d);
      let all = true;
      for (let k = 0; k < 50; k++) {
        const x = Array.from({ length: n }, r),
          y = Array.from({ length: n }, r);
        if (norm2(cdMul(x, y)) !== norm2(x) * norm2(y)) all = false;
      }
      expect(all).toBe(holds);
    }
  });

  it("makes the Baez table the Dickson/Schafer transpose", () => {
    for (let d = 1; d <= 4; d++) {
      const n = 1 << d, w = signTable(d), b = signTable(d, "B");
      for (let a = 0; a < n; a++) {
        for (let c = 0; c < n; c++) expect(b[a * n + c]).toBe(w[c * n + a]);
      }
    }
  });

  it("agrees across the dense, literal, closed-form and four-block routes on 𝒲", () => {
    for (let d = 0; d < 4; d++) {
      const w = signTable(d), next = signTable(d + 1);
      expect(inW(w, d).slice(0, 2)).toEqual([0, 0]);
      expect(Array.from(literalCD(w, d))).toEqual(Array.from(next));
      expect(Array.from(closedCD(w, d))).toEqual(Array.from(next));
      expect(Array.from(fourBlockCD(w, d))).toEqual(Array.from(next));
    }
  });

  it("finds K(CD w) = S(K w) on all of 𝒲1 and 𝒲2", () => {
    for (const d of [1, 2]) {
      const ws = allLawful(d);
      expect(ws.length).toBe(1 << (((1 << d) * ((1 << d) - 1)) / 2));
      for (const w of ws) expect(kAgrees(w, d, literalCD(w, d))).toBe(true);
    }
  });

  it("finds the literal doubling of r = 0 on F2^2 off 𝒲 and violating the relation", () => {
    const r = new Uint8Array(16);
    expect(inW(r, 2)[0]).toBeGreaterThan(0);
    expect(kAgrees(r, 2, literalCD(r, 2))).toBe(false);
    expect(kAgrees(r, 2, closedCD(r, 2))).toBe(true);
  });

  it("finds no positive squares or two-term annihilators below 16", () => {
    for (let d = 1; d <= 3; d++) {
      expect(positiveSquares(signTable(d), d)).toHaveLength(0);
      expect(twoTerm(d, (x, y) => cdMul(x, y)).pairs).toHaveLength(0);
    }
  });

  it("reproduces the reference sedenion incidence (oracle self-test only)", () => {
    const w = signTable(4);
    const pos = positiveSquares(w, 4);
    expect(pos).toHaveLength(168);
    expect(pos.filter((q) => q.a < q.c)).toHaveLength(84);
    const t = twoTerm(4, (x, y) => cdMul(x, y));
    expect(t.verts).toHaveLength(84);
    expect(t.supports).toHaveLength(42);
    expect(t.edges).toHaveLength(168);
    expect(t.verts.every((x) => t.degree(x) === 4)).toBe(true);
    expect(t.suppEdges).toHaveLength(84);
    expect(t.components.map((c) => c.length)).toEqual([6, 6, 6, 6, 6, 6, 6]);
    // The table route gives the same products as pure recursion.
    const viaTable = twoTerm(4, tableMul(w, 4));
    expect(viaTable.pairs.length).toBe(t.pairs.length);
  });

  it("predicts exactly four changed entries for the causal poke", () => {
    const w3 = signTable(3), w4 = signTable(4);
    const x4 = literalCD(poke(w3, 3, 3, 5), 3);
    const changed: [number, number][] = [];
    for (let A = 0; A < 16; A++) {
      for (let C = 0; C < 16; C++) {
        if (x4[A * 16 + C] !== w4[A * 16 + C]) changed.push([A, C]);
      }
    }
    expect(changed).toEqual([[3, 5], [5, 11], [11, 5], [13, 11]]);
  });

  it("ranks over F2 by elimination", () => {
    expect(rankF2([1, 2, 4])).toBe(3);
    expect(rankF2([1, 2, 3])).toBe(2);
    expect(rankF2([0, 5, 5])).toBe(1);
    expect(basis(4, 2)).toEqual([0, 0, 1, 0]);
  });

  it("builds every expected record set without internal disagreement", () => {
    expect(expectMain().length).toBeGreaterThan(0);
    expect(expectControls().length).toBeGreaterThan(0);
    expect(expectAltSeed().length).toBeGreaterThan(0);
    expect(expectClosure().length).toBe(9);
  });
});
