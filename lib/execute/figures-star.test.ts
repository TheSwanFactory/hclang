/**
 * FOIST 19a: public * is Cart, whereas the retained internal inlay algorithm
 * FrameArray.star performs recursive terminal replacement. These must not be
 * conflated in HC source or regressions.
 */
import { expect } from "jsr:@std/expect@^0.219.1";
import { HCLang } from "../mod.ts";
import { FrameArray, FrameCount } from "../frames.ts";

const nest = (...items: FrameArray[]): FrameArray => new FrameArray(items);
const leaf = (): FrameArray => new FrameArray([]);

Deno.test("FOIST 19a native Cart is flat and preserves immediate shape", async () => {
  const hc = new HCLang();
  expect(await hc.call("[[], [[], []]] * [1, 2]"))
    .toEqual("[[[], 1], [[], 2], [[[], []], 1], [[[], []], 2]]");
  expect(await hc.call("[1, 2] * [3, 4]"))
    .toEqual("[[1, 3], [1, 4], [2, 3], [2, 4]]");
});

Deno.test("internal inlay remains a distinct recursive algorithm", () => {
  const replacement = new FrameArray([new FrameCount(9n)]);
  const input = nest(leaf(), nest(leaf(), leaf()));
  const inlaid = input.star(replacement);
  expect(inlaid.toString()).toEqual("[[9], [[9], [9]]]");
  expect(input.toString()).toEqual("[[], [[], []]]");
  expect(replacement.toString()).toEqual("[9]");
});

Deno.test("internal inlay replaces an empty Frame without annihilation", () => {
  const replacement = new FrameArray([new FrameCount(2n)]);
  expect(leaf().star(replacement).toString()).toEqual("[2]");
  expect(nest(leaf()).star(replacement).toString()).toEqual("[[2]]");
});

Deno.test("Cart and internal inlay give different nested outcomes", () => {
  const left = nest(leaf());
  const right = new FrameArray([new FrameCount(1n)]);
  expect(left.star(right).toString()).toEqual("[[1]]");
  expect(new FrameArray([
    new FrameArray([left.elements()[0], right.elements()[0]]),
  ]).toString()).toEqual("[[[], 1]]");
});
