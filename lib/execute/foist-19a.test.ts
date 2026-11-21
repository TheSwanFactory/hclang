import { expect } from "jsr:@std/expect@^0.219.1";
import { Frame, FrameArray, FrameCount, FrameExpr } from "../frames.ts";
import { CartElements, FlopElements } from "../ops/pairings.ts";
import { multiplyDenum, observeDenum, observeKDCoordinates } from "../frames/fourth-hash.ts";
import { constructDenum } from "./denum-prologue.ts";
import { evaluate } from "./evaluate.ts";

const count = (n: bigint): FrameCount => new FrameCount(n);
const denum = (c: bigint, values: readonly bigint[]): Frame =>
  constructDenum(count(c), values.map(count));
const rawState = (value: Frame): [string, string[]] => [
  String(value.referent().getOwn("count")),
  value.referent().getOwn("loads").referent().elements().map(String),
];
const read = (source: string): Frame =>
  FrameExpr.answeredValue(evaluate(source).at(-1)).referent();

Deno.test("FOIST 19a: the third hash is raw Denumeration", () => {
  expect(rawState(read("[3, 1].###"))).toEqual(["2", ["3", "1"]]);
  expect(rawState(read("[3, 1, 5].###"))).toEqual([
    "3",
    ["3", "1", "5"],
  ]);
  expect(rawState(read("[].###"))).toEqual(["0", []]);
  expect(rawState(denum(9n, [3n, 1n]).sizeFor("###")))
    .toEqual(["9", ["3", "1"]]);
});

Deno.test("FOIST 19a: the fourth hash is observational KD coordinates", () => {
  expect(read("[3, 1].####").toString()).toEqual("[2]");
  expect(read("[3, 1, 5].####").toString()).toEqual("[-2, 1]");
  expect(read("[].####").toString()).toEqual("[]");
  expect(observeKDCoordinates(denum(9n, [3n, 1n])).toString())
    .toEqual("[2]");
  expect(rawState(observeDenum(new FrameArray([count(3n), count(1n)]))))
    .toEqual(["2", ["3", "1"]]);
});

Deno.test("FOIST 19a: Frame Flop and Cart preserve receiver order", () => {
  expect(read("[1, 2] + [3, 4]").toString()).toEqual("[1, 2, 3, 4]");
  expect(read("[1, 2] * [3, 4]").toString())
    .toEqual("[[1, 3], [1, 4], [2, 3], [2, 4]]");
  expect(CartElements(denum(2n, [3n, 1n]), denum(2n, [4n, 2n]))
    .toString()).toEqual("[[3, 4], [3, 2], [1, 4], [1, 2]]");
  expect(rawState(FlopElements(denum(0n, [0n, 0n]), denum(2n, [3n, 1n]))))
    .toEqual(["2", ["3", "1"]]);
});

Deno.test("FOIST 19a: unary negative rotates Denum loads without promoted rank", () => {
  const d = denum(2n, [3n, 1n]);
  expect(rawState(Frame.negateDenum(d)!)).toEqual(["2", ["1", "3"]]);
  expect(rawState(Frame.negateDenum(denum(3n, [3n, 1n, 5n]))!))
    .toEqual(["3", ["5", "0", "3", "1"]]);
  expect(rawState(Frame.negateDenum(denum(1n, [3n]))!))
    .toEqual(["1", ["0", "3"]]);
  expect(rawState(d)).toEqual(["2", ["3", "1"]]);
  expect(rawState(Frame.negateDenum(denum(0n, []))!))
    .toEqual(["0", []]);
});

Deno.test("FOIST 19a: signed-XOR &|& constructs a Denum with Count product", () => {
  const neg = denum(2n, [0n, 1n]);
  const square = multiplyDenum(neg, neg);
  expect(rawState(square)).toEqual(["4", ["1", "0"]]);
  expect(square.sizeFor("####").toString()).toEqual("[1]");
  const imaginary = denum(2n, [0n, 1n, 0n, 0n]);
  expect(multiplyDenum(imaginary, imaginary).sizeFor("####").toString())
    .toEqual("[-1, 0]");
  expect(rawState(multiplyDenum(denum(3n, [3n]), denum(7n, [3n]))))
    .toEqual(["21", ["9"]]);
  expect(rawState(multiplyDenum(denum(0n, []), neg))).toEqual(["0", []]);
});

Deno.test("FOIST 19a: the removed suffix observers refuse rather than alias", () => {
  const d = denum(2n, [3n, 1n]);
  for (
    const key of [
      "#%", "##%", "###%", "##%%", "###%%", "##%%%", "###%%%",
    ]
  ) {
    expect(Frame.SIZE_OPERATORS.includes(key)).toEqual(false);
    expect(d.sizeFor(key)).toBe(Frame.nil);
  }
  expect(read("5 %% 2").toString()).toEqual("1");
});
