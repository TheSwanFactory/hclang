/** FOIST 19a: native * is Cartesian pairing, not recursive inlay. */
import { expect } from "@std/expect";
import { HCLang } from "../mod.ts";
import { Frame, FrameArray, FrameCount } from "../frames.ts";
import { Multiply } from "../ops/math.ts";

const counts = (...items: number[]): FrameArray =>
  new FrameArray(items.map((i) => new FrameCount(BigInt(i))));

Deno.test("FOIST 19a Cart pairs immediate occurrences in left-major order", async () => {
  const hc = new HCLang();
  for (
    const [source, expected] of [
      ["[] * [2, 3]", "[]"],
      ["[2, 3] * []", "[]"],
      [
        "[[], [[], []]] * [1, 2]",
        "[[[], 1], [[], 2], [[[], []], 1], [[[], []], 2]]",
      ],
    ] as const
  ) {
    expect(await hc.call(source), source).toEqual(expected);
  }
});

Deno.test("FOIST 19a numeric scalars keep exact multiplication", async () => {
  const hc = new HCLang();
  for (
    const [source, expected] of [
      ["2 * 3", "6"],
      ["0 * 9", "0"],
      ["(0 - 2) * 3", "-6"],
      ["2 * 1.5", "3.0"],
      ["(2 / 3) * (3 / 4)", "1/2"],
      ["2 + 3 * 4", "20"],
    ] as const
  ) {
    expect(await hc.call(source), source).toEqual(expected);
  }
});

Deno.test("FOIST 19a Cart preserves empty terminals and nesting without inlay", () => {
  const empty = new FrameArray([]);
  const nested = new FrameArray([empty, empty]);
  const left = new FrameArray([empty, nested]);
  const right = counts(3, 4);
  expect(Multiply(left, right).toString())
    .toEqual("[[[], 3], [[], 4], [[[], []], 3], [[[], []], 4]]");
  expect(left.toString()).toEqual("[[], [[], []]]");
  expect(right.toString()).toEqual("[3, 4]");
  expect(Multiply(new FrameArray([]), right).toString()).toEqual("[]");
});

Deno.test("FOIST 19a Cart preserves order and duplicate element identity", () => {
  const shared = new FrameArray([new FrameCount(1n)]);
  const left = new FrameArray([shared, shared]);
  const right = counts(2);
  const pairs = Multiply(left, right) as FrameArray;
  expect(pairs.toString()).toEqual("[[[1], 2], [[1], 2]]");
  const twoPairs = pairs.elements();
  const first = twoPairs[0] as FrameArray;
  const second = twoPairs[1] as FrameArray;
  expect(first.elements()[0]).toBe(shared);
  expect(second.elements()[0]).toBe(shared);
});

Deno.test("FOIST 19a Cart propagates error operands", () => {
  const bad = Frame.error("$!.star-test");
  expect(Multiply(bad, counts(1)).toString()).toContain("star-test");
  expect(Multiply(counts(1), bad).toString()).toContain("star-test");
});
