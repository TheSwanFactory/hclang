import { expect } from "@std/expect";
import { HCLang } from "../mod.ts";
import { kdCdSign, kdMultiplyLoads } from "../frames/kd-signed-xor.ts";

// Differential test of the pure-HC kernel `hc/kd.hc` against the native
// `&|&` load kernel (#576). The module is imported once, and each
// group of cases is evaluated as one HC list, so the test pays one import and
// a few evaluations rather than one evaluation per case.

/** The one session that imports the pure-HC kernel as `KD`. */
const session: Promise<HCLang> = (async () => {
  const hc = new HCLang();
  await hc.call("KD <- './hc/kd.hc';");
  return hc;
})();
const kd = (): Promise<HCLang> => session;

/** HC source for a list of loads, `[3, 0, 1]`. */
const hcLoads = (loads: readonly bigint[]): string => `[${loads.join(", ")}]`;

/** The unit load at signed slot `index` of a value with `slots` slots. */
const unit = (slots: number, index: number): bigint[] =>
  Array.from({ length: slots }, (_, i) => i === index ? 1n : 0n);

/** Every ordered product of unit loads at one signed arity. */
const basisTable = (slots: number): Array<[bigint[], bigint[]]> =>
  Array.from({ length: slots * slots }, (_, n) => [
    unit(slots, Math.floor(n / slots)),
    unit(slots, n % slots),
  ]);

/** Deterministic 32-bit generator (mulberry32), so failures reproduce. */
const seeded = (seed: number): () => number => () => {
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

/** 1 to 16 loads below 1,000, about a quarter of them zero. */
const randomLoads = (random: () => number): bigint[] =>
  Array.from(
    { length: 1 + Math.floor(random() * 16) },
    () => random() < 0.25 ? 0n : BigInt(Math.floor(random() * 1000)),
  );

/** Compares `KD.kd_multiply` with `kdMultiplyLoads` on every pair at once. */
const compareProducts = async (
  hc: HCLang,
  pairs: Array<[bigint[], bigint[]]>,
): Promise<void> => {
  const source = `[${
    pairs.map(([l, r]) => `KD.kd_multiply [${hcLoads(l)}, ${hcLoads(r)}]`)
      .join(", ")
  }]`;
  const expected = `[${
    pairs.map(([l, r]) => hcLoads(kdMultiplyLoads(l, r))).join(", ")
  }]`;
  expect(await hc.call(source)).toEqual(expected);
};

Deno.test("hc/kd.hc cd_sign matches kdCdSign for every u, v < 32", async () => {
  const hc = await kd();
  const pairs = Array.from(
    { length: 32 * 32 },
    (_, n) => [BigInt(Math.floor(n / 32)), BigInt(n % 32)] as const,
  );
  const source = `[${
    pairs.map(([u, v]) => `KD.cd_sign [${u}, ${v}]`).join(", ")
  }]`;
  const expected = `[${pairs.map(([u, v]) => kdCdSign(u, v)).join(", ")}]`;
  expect(await hc.call(source)).toEqual(expected);
});

Deno.test("hc/kd.hc kd_multiply matches kdMultiplyLoads on basis tables", async () => {
  const hc = await kd();
  // Real, complex, quaternion and octonion: 2, 4, 8 and 16 signed slots.
  for (const slots of [2, 4, 8, 16]) {
    await compareProducts(hc, basisTable(slots));
  }
});

Deno.test("hc/kd.hc kd_multiply matches kdMultiplyLoads on scalars and mixed ranks", async () => {
  const hc = await kd();
  await compareProducts(hc, [
    // Unsigned one-load scalars stay at arity one.
    [[3n], [3n]],
    [[0n], [4n]],
    [[7n], [0n]],
    // An unsigned scalar meets a signed value.
    [[3n], [0n, 1n]],
    [[2n], [1n, 2n, 3n, 4n]],
    [[1n, 2n, 3n, 4n, 5n], [6n]],
    // Mixed ranks, with lazy completion of partial arities.
    [[3n, 1n], [0n, 1n, 0n, 0n]],
    [[3n, 1n, 5n], [2n, 0n, 1n, 4n, 0n, 0n, 3n, 1n]],
    [[0n, 1n, 0n, 0n], [0n, 0n, 1n, 0n, 0n, 0n, 0n, 0n]],
    [[1n, 2n, 3n, 4n, 5n, 6n, 7n, 8n, 9n], [9n, 8n, 7n]],
    [[0n, 0n, 0n], [5n, 5n]],
    // Large exact magnitudes.
    [[123456789012345678901234567890n, 1n], [987654321098765432109876543210n]],
  ]);
});

Deno.test("hc/kd.hc kd_multiply matches kdMultiplyLoads on 200 seeded random pairs", async () => {
  const hc = await kd();
  const random = seeded(576);
  const pairs = Array.from(
    { length: 200 },
    () => [randomLoads(random), randomLoads(random)] as [bigint[], bigint[]],
  );
  await compareProducts(hc, pairs);
});

Deno.test("hc/kd.hc kd_multiply refuses above the budget as native &|& does", async () => {
  const hc = await kd();
  const native = await hc.call("(513 [1]).### &|& ((513 [1]).###)");
  expect(native).toEqual("$!.denum-product-budget &|&");
  // 513 × 513 and 512 × 513 nonzero pairs both exceed 262,144.
  expect(await hc.call("KD.kd_multiply [513 [1], 513 [1]]")).toEqual(native);
  expect(await hc.call("KD.kd_multiply [512 [1], 513 [1]]")).toEqual(native);
  expect(await hc.call("KD.kd_multiply [[0] + (512 [1]), 513 [1]]"))
    .toEqual(native);
  // The refusal is the system kind, as the native error is.
  expect(
    await hc.call(
      "(KD.kd_multiply [513 [1], 513 [1]]) $! {($# ~ <$!.denum-product-budget>) ? {1} : {0}}",
    ),
  ).toEqual("1");
});

Deno.test("hc/kd.hc kd_multiply answers [] for an empty side, as &|& does", async () => {
  const hc = await kd();
  expect(
    await hc.call(
      "[KD.kd_multiply [[], [3, 1]], ([].### &|& ([3, 1].###)).loads]",
    ),
  )
    .toEqual("[[], []]");
});
