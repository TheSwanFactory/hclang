import { expect } from "@std/expect";
import { describe, it } from "@std/testing/bdd";

import { Frame, FrameArray, FrameInt } from "../frames.ts";
import {
  CART_MAX_PAIRS,
  CartElements,
  FlopElements,
  ZipElements,
} from "./pairings.ts";

const ints = (...values: number[]): FrameArray =>
  new FrameArray(values.map((value) => FrameInt.for(`${value}`)));

describe("native Cart *", () => {
  it("pairs every occurrence in left-major order", () => {
    expect(ints(1, 2).get("*").call(ints(10, 20, 30)).toString())
      .toEqual(
        "[[1, 10], [1, 20], [1, 30], [2, 10], [2, 20], [2, 30]]",
      );
  });

  it("preserves repeated occurrences", () => {
    expect(CartElements(ints(1, 1), ints(2, 2)).toString())
      .toEqual("[[1, 2], [1, 2], [1, 2], [1, 2]]");
  });

  it("rejects excessive public Cart allocation before enumerating pairs", () => {
    const left = new FrameArray(
      Array.from({ length: 513 }, () => FrameInt.for("1")),
    );
    expect(513 * 513).toBeGreaterThan(CART_MAX_PAIRS);
    expect(CartElements(left, left).toString())
      .toEqual("$!.cart-product-budget *");
    expect(CartElements(ints(), left).toString()).toEqual("[]");
  });

  it("returns empty when either input has no elements", () => {
    expect(CartElements(ints(), ints(1, 2)).toString()).toEqual("[]");
    expect(CartElements(ints(1, 2), ints()).toString()).toEqual("[]");
  });

  it("pairs nested children as whole values without mutating sources", () => {
    const left = new FrameArray([ints(1), ints(2)]);
    const right = new FrameArray([ints(3), ints(4)]);
    expect(CartElements(left, right).toString())
      .toEqual("[[[1], [3]], [[1], [4]], [[2], [3]], [[2], [4]]]");
    expect(left.toString()).toEqual("[[1], [2]]");
    expect(right.toString()).toEqual("[[3], [4]]");
  });
});

describe("native Flop", () => {
  // `+` and `-` answer an error operand before they Flop. From HC, Flop meets
  // an error only on the right, a Denum too wide for `-` to negate
  // (`foist-19a.test.ts`), so a host hands it the rest (#524).
  it("answers an error operand, the left first", () => {
    const left = Frame.error("$!.left");
    const right = Frame.error("$!.right");
    expect(FlopElements(left, ints(1))).toBe(left);
    expect(FlopElements(ints(1), right)).toBe(right);
    expect(FlopElements(left, right)).toBe(left);
    expect(FlopElements(ints(1), ints(2, 3)).toString()).toEqual("[1, 2, 3]");
  });
});
describe("native Zip |&|", () => {
  it("pairs equal lengths positionally", () => {
    expect(ints(1, 2).get("|&|").call(ints(10, 20)).toString())
      .toEqual("[[1, 10], [2, 20]]");
  });

  it("truncates to the shorter input in either direction", () => {
    expect(ZipElements(ints(1, 2), ints(10, 20, 30)).toString())
      .toEqual("[[1, 10], [2, 20]]");
    expect(ZipElements(ints(1, 2, 3), ints(10)).toString())
      .toEqual("[[1, 10]]");
  });

  it("returns empty when either input has no elements", () => {
    expect(ZipElements(ints(), ints(10)).toString()).toEqual("[]");
    expect(ZipElements(ints(1), ints()).toString()).toEqual("[]");
  });

  it("ignores named properties on both operands", () => {
    const left = ints(1, 2);
    const right = ints(10, 20, 30);
    left.set("meta", FrameInt.for("9"));
    right.set("tag", FrameInt.for("8"));

    expect(left.get("|&|").call(right).toString())
      .toEqual("[[1, 10], [2, 20]]");
    expect(left.get("*").call(right).toString())
      .toEqual(
        "[[1, 10], [1, 20], [1, 30], [2, 10], [2, 20], [2, 30]]",
      );
    expect(left.get("meta").toString()).toEqual("9");
    expect(right.get("tag").toString()).toEqual("8");
  });

  it("preserves duplicate values and nested positional elements", () => {
    expect(ZipElements(ints(1, 1), ints(2, 2)).toString())
      .toEqual("[[1, 2], [1, 2]]");
    const left = new FrameArray([ints(1), ints(2)]);
    const right = new FrameArray([ints(3)]);
    expect(ZipElements(left, right).toString())
      .toEqual("[[[1], [3]]]");
  });
});
