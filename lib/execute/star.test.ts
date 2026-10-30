import { expect } from "jsr:@std/expect@^0.219.1";
import { HCLang } from "../mod.ts";
import { Frame } from "../frames/frame.ts";
import { FrameArray } from "../frames/frame-array.ts";
import { Multiply } from "../ops/math.ts";

Deno.test("Star constructs required frames and retains numeric arithmetic", async () => {
  const session = new HCLang();
  for (
    const [source, result] of [
      ["2 * 3", "6"],
      ["2 * [[], []]", "[[[], []], [[], []]]"],
      ["[[], []] * 3", "[3, 3]"],
      ["[[], []] * [[], []]", "[[[], []], [[], []]]"],
      ["[] * [[], []]", "[[], []]"],
      ["[[], [[], []]] * 7", "[7, [7, 7]]"],
      ["0 * [[], []]", "0"],
      ["(0 - 2) * 3", "-6"],
      ["2 * 1.5", "3.0"],
      ["(2 / 3) * (3 / 4)", "1/2"],
      ["2 + 3 * 4", "20"],
      ["2 * “y”", "[“y”, “y”]"],
    ]
  ) expect(await session.call(source), source).toEqual(result);
});

Deno.test("Star Size observes construction including count zero", async () => {
  const session = new HCLang();
  for (
    const [x, y] of [
      ["2", "[[], [], []]"],
      ["[[], []]", "3"],
      ["[[], [[], []]]", "[[], []]"],
      ["[]", "[[], []]"],
      ["0", "[[], []]"],
      ["[[], []]", "0"],
    ]
  ) {
    expect(await session.call(`(${x} * ${y}).## = (${x}.## * ${y}.##)`))
      .toEqual("<>");
  }
  expect(await session.call("(2 * [[], [], []]).##")).toEqual("6");
  expect(await session.call("([[], []] * 3).##")).toEqual("6");
});

Deno.test("Star shares replacement identity, rebuilds ancestors and preserves inputs", async () => {
  const session = new HCLang();
  await session.call(
    ".y [.tag 9; []]; .host [[], [[], []]]; .r (host * y); .n (2 * y);",
  );
  for (
    const source of [
      "(r .0) === y",
      "((r .1) .0) === y",
      "((r .1) .1) === y",
      "(n .0) === y",
      "(n .1) === y",
      "(r === host) = ()",
      "host = [[], [[], []]]",
      "y = [.tag 9; []]",
    ]
  ) expect(await session.call(source), source).toEqual("<>");
});

Deno.test("Star preserves reconstructible metadata and refuses loss", async () => {
  const session = new HCLang();
  await session.call(
    ".parent [.m 9]; .host [.^ parent; .k 1; [], [.j 2; []]]; .r (host * [[]]);",
  );
  for (
    const source of [
      "r.m = 9",
      "r.k = 1",
      "(r .1).j = 2",
      "host.k = 1",
      "(host .0) = []",
    ]
  ) expect(await session.call(source), source).toEqual("<>");
  for (
    const source of [
      "[.tag 3] * [[]]",
      "[[], [.tag 3]] * [[]]",
      "[.^ parent;] * [[]]",
      "[1;] * [[]]",
    ]
  ) expect(await session.call(source), source).toContain("star-metadata");
});

Deno.test("Star refuses unsupported hosts and bounded count overflow", async () => {
  const session = new HCLang();
  for (
    const source of [
      "[[], (1 - 0)] * []",
      "“host” * []",
      "(0 - 2) * []",
      "(3 - 1) * []",
      "1.5 * []",
      "(1 / 2) * []",
      "{[]} * []",
    ]
  ) expect(await session.call(source), source).toContain("star-domain");
  expect(await session.call("65537 * []")).toContain("repetition-limit");
});

Deno.test("Star neither invokes effectful application nor follows cyclic hosts", () => {
  const terminal = new FrameArray([]);
  const host = new FrameArray([terminal]);
  const replacement = new FrameArray([]);
  host.apply = (): Frame => {
    throw new Error("must not apply host");
  };
  replacement.apply = (): Frame => {
    throw new Error("must not apply replacement");
  };
  expect((Multiply(host, replacement) as FrameArray).at(0)).toBe(replacement);
  host.asArray().push(host);
  expect(Multiply(host, replacement).toString()).toContain("star-domain");
});

Deno.test("Star composes nested counts using the root count rule", async () => {
  const session = new HCLang();
  for (
    const [source, expected] of [
      ["[2] * [[]]", "[[[[]], [[]]]]"],
      ["[2] * 3", "[6]"],
      ["([[], []] * 3) * [[]]", "[[[[]], [[]], [[]]], [[[]], [[]], [[]]]]"],
    ]
  ) expect(await session.call(source), source).toEqual(expected);
  expect(await session.call("([2] * [[]]).##")).toEqual("2");
  expect(await session.call("([65537] * [[]])")).toContain("repetition-limit");
});

Deno.test("Star retains zero-count leaves and their zero Size through composition", async () => {
  const session = new HCLang();
  expect(await session.call("[0, [2, []]] * [[]]"))
    .toEqual("[0, [[[[]], [[]]], [[]]]]");
  expect(await session.call("([0, [2, []]] * [[]]).##")).toEqual("3");
  expect(await session.call("([0] * [[]]).##")).toEqual("0");
});

Deno.test("Star iterates a count-valued result with shared replacement identity", async () => {
  const session = new HCLang();
  await session.call(".x [[], []]; .y [.tag 9; []]; .r ((x * 3) * y);");
  for (
    const source of [
      "r = (x * (3 * y))",
      "r.## = 6",
      "((r .0) .0) === y",
      "((r .1) .2) === y",
      "x = [[], []]",
      "y = [.tag 9; []]",
    ]
  ) expect(await session.call(source), source).toEqual("<>");
});
