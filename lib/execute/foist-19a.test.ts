import { expect } from "@std/expect";
import { Frame, FrameArray } from "../frames.ts";
import { CartElements, FlopElements } from "../ops/pairings.ts";
import {
  multiplyDenum,
  observeDenum,
  observeKDCoordinates,
} from "../frames/fourth-hash.ts";
import {
  answerOfLast as read,
  countOf as count,
  denumOf as denum,
} from "../test-helpers.test.ts";

const rawState = (value: Frame): [string, string[]] => [
  String(value.referent().getOwn("count")),
  value.referent().getOwn("loads").referent().elements().map(String),
];

Deno.test("FOIST 19a: the third hash is raw Denumeration", () => {
  expect(rawState(read("[3, 1].###"))).toEqual(["2", ["3", "1"]]);
  expect(rawState(read("[3, 1, 5].###"))).toEqual([
    "3",
    ["3", "1", "5"],
  ]);
  expect(rawState(read("[].###"))).toEqual(["0", []]);
  // Count is independent from raw load arity, including declared zero Count.
  expect(rawState(read("[.# {0}; 3, 1].###"))).toEqual([
    "0",
    ["3", "1"],
  ]);
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

Deno.test("FOIST 19a fourth hash uses the load arity, not construction Count", () => {
  expect(denum(1n, [3n, 1n]).sizeFor("####").toString())
    .toEqual("[2]");
  expect(denum(8n, [3n, 1n]).sizeFor("####").toString())
    .toEqual("[2]");
  expect(denum(3n, [3n, 1n, 5n]).sizeFor("####").toString())
    .toEqual("[-2, 1]");
  expect(denum(3n, [3n, 1n, 5n, 0n]).sizeFor("####").toString())
    .toEqual("[-2, 1]");
});

Deno.test("FOIST 19a fourth hash is gauge-invariant and pure", () => {
  const raw = denum(4n, [3n, 1n, 5n, 0n]);
  const gauge = denum(4n, [6n, 2n, 8n, 1n]);
  expect(raw.sizeFor("####").toString())
    .toEqual(gauge.sizeFor("####").toString());
  expect(raw.getOwn("loads").toString()).toEqual("[3, 1, 5, 0]");
  expect(gauge.getOwn("loads").toString()).toEqual("[6, 2, 8, 1]");
});

Deno.test("FOIST 19a preserves the empty Denum as the raw zero-arity state", () => {
  const empty = denum(0n, []);
  expect(empty.sizeFor("###").getOwn("count").toString()).toEqual("0");
  expect(empty.sizeFor("###").getOwn("loads").toString()).toEqual("[]");
  expect(empty.sizeFor("####").toString()).toEqual("[]");
});

Deno.test("FOIST 19a: Frame Flop and Cart preserve receiver order", () => {
  expect(read("[1, 2] + [3, 4]").toString()).toEqual("[1, 2, 3, 4]");
  expect(read("[1, 2] * [3, 4]").toString())
    .toEqual("[[1, 3], [1, 4], [2, 3], [2, 4]]");
  expect(
    CartElements(denum(2n, [3n, 1n]), denum(2n, [4n, 2n]))
      .toString(),
  ).toEqual("[[3, 4], [3, 2], [1, 4], [1, 2]]");
  expect(rawState(FlopElements(denum(0n, [0n, 0n]), denum(2n, [3n, 1n]))))
    .toEqual(["2", ["3", "1"]]);
});

Deno.test("FOIST 19a: Flop retains receiver Count phase", () => {
  expect(read("([3, 1].### + [1, 2].###).####").toString())
    .toEqual("[1]");
  expect(read("((([3, 1].###) 0) + [1, 2].###).####").toString())
    .toEqual("[3]");
  expect(read("((([3, 1].###) 0) - [1, 2].###).####").toString())
    .toEqual("[1]");
});

Deno.test("FOIST 19a: mixed scalar Flop follows application, subtraction refuses non-Denums", () => {
  expect(read("3 + [2, 5]").toString()).toEqual("30");
  expect(read("1 + [2]").toString()).toEqual("2");
  expect(read("5 - ([3, 1].###)").toString()).toEqual("15");
  expect(read("0 - ([3, 1].###)").toString()).toEqual("0");
  expect(read("([3, 1].###) - [1, 2]").toString())
    .toEqual("$!.flop-domain -");
  expect(read("[1, 2] - [3]").toString()).toEqual("$!.flop-domain -");
});

Deno.test("FOIST 19a: unary negative rotates Denum loads without promoted rank", () => {
  const d = denum(2n, [3n, 1n]);
  expect(rawState(Frame.negateDenum(d)!)).toEqual(["2", ["1", "3"]]);
  expect(rawState(Frame.negateDenum(denum(3n, [3n, 1n, 5n]))!))
    .toEqual(["3", ["5", "0", "3", "1"]]);
  expect(rawState(Frame.negateDenum(denum(1n, [3n]))!))
    .toEqual(["1", ["0", "3"]]);
  expect(rawState(d)).toEqual(["2", ["3", "1"]]);
  expect(read("- ([3, 1].###)").sizeFor("####").toString()).toEqual("[-2]");
  expect(read("([3, 1].###) - ([1, 2].###)").sizeFor("####").toString())
    .toEqual("[3]");
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

Deno.test("FOIST 19a: KD capacity and product budget use public named refusals", () => {
  const dense = denum(513n, Array<bigint>(513).fill(1n));
  expect(multiplyDenum(dense, dense).toString())
    .toEqual("$!.denum-product-budget &|&");

  const wide = denum(65537n, Array<bigint>(65537).fill(1n));
  expect(observeKDCoordinates(wide).toString())
    .toEqual("$!.denum-kd-capacity");
  expect(Frame.negateDenum(wide)?.toString())
    .toEqual("$!.denum-kd-capacity");
  // Subtraction Flops with that refusal, and Flop answers it (#524).
  expect(read("[1] - (65537 [1]).###").toString())
    .toEqual("$!.denum-kd-capacity");
  expect(multiplyDenum(wide, denum(2n, [1n, 0n])).toString())
    .toEqual("$!.denum-product-capacity &|&");
});

Deno.test("FOIST 19a: retired Count/geometry internals are not installed", () => {
  for (
    const key of [
      "kBIND",
      "GEOMETRY_SUFFIXES",
      "GEOMETRIC_OBSERVERS",
      "bindCount",
      "observeGeometry",
      "kRESIDUAL",
      "kDENUM",
    ]
  ) {
    expect(Object.hasOwn(Frame, key)).toBe(false);
  }
  expect(Frame.kRAW_DENUM).toEqual("###");
  expect(Frame.kKD_COORDINATES).toEqual("####");
  expect(Frame.SIZE_OPERATORS).toEqual(["#", "##", "###", "####"]);
  expect(Object.hasOwn(FrameArray, "starCount")).toBe(false);
  expect(Object.hasOwn(FrameArray.prototype, "star")).toBe(false);
});

Deno.test("FOIST 19a: the removed suffix observers refuse rather than alias", () => {
  const d = denum(2n, [3n, 1n]);
  for (
    const key of [
      "#%",
      "##%",
      "###%",
      "##%%",
      "###%%",
      "##%%%",
      "###%%%",
    ]
  ) {
    expect(Frame.SIZE_OPERATORS.includes(key)).toEqual(false);
    expect(d.sizeFor(key)).toBe(Frame.nil);
  }
  expect(read("5 %% 2").toString()).toEqual("1");
});
