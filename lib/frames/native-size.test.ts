import { FrameHandle } from "./frame-handle.ts";
import { expect } from "jsr:@std/expect@^0.219.1";
import {
  EvaluationScope,
  Frame,
  FrameAlias,
  FrameArray,
  FrameBlob,
  FrameBytes,
  FrameCount,
  FrameExpr,
  FrameNumber,
  FrameScoped,
  FrameString,
} from "../frames.ts";
import { evaluate } from "../execute/evaluate.ts";
import { tryDenumState } from "./fourth-hash.ts";

const last = (source: string): Frame =>
  evaluate(source).at(-1).asArray().at(-1)!;

Deno.test("Size evaluates exact truncated magnitudes without Number projection", () => {
  for (
    const [source, size] of [
      ["7.9", "7"],
      ["(-7.9)", "7"],
      ["(-3)", "3"],
      ["0.9", "0"],
      ["0", "0"],
      ["(-7 / 2)", "3"],
      ["(-1 / 2)", "0"],
      ["(7 / -2)", "3"],
      ["9007199254740993123456789", "9007199254740993123456789"],
      ["(-9007199254740993123456789.99)", "9007199254740993123456789"],
      ["(-90071992547409931234567899 / 10)", "9007199254740993123456789"],
    ]
  ) {
    const result = last(`${source}.##`);
    expect(result, source).toBeInstanceOf(FrameCount);
    expect(result.toString(), source).toEqual(size);
  }
  for (const value of [7.9, -7.9, 0.9, -0, 1e100]) {
    expect(new FrameNumber(value).sizeFor("##").toString())
      .toEqual(BigInt(Math.trunc(Math.abs(value))).toString());
  }
  for (const value of [NaN, Infinity, -Infinity]) {
    const atom = new FrameNumber(value);
    expect(atom.sizeFor("##").toString()).toEqual(
      "$!.nonquantifiable-size .##",
    );
    expect(new FrameArray([atom]).sizeFor("##").toString())
      .toEqual("$!.nonquantifiable-size .##");
    expect(new FrameArray([atom]).sizeFor("###").toString())
      .toEqual("$!.nonquantifiable-size .##");
  }
});

Deno.test("text uses native Unicode code points; blobs use bits and payloads bytes", () => {
  for (
    const [source, size] of [
      ['""', "0"],
      ['"hello"', "5"],
      ['"é😀"', "2"],
      ['"é"', "2"],
      ["`é😀`", "2"],
      ["0b0001", "4"],
      ["0x00ff", "16"],
      ["\\0\\", "0"],
      ["\\3\\abc", "3"],
    ]
  ) {
    expect(last(`${source}.##`).toString(), source).toEqual(size);
  }
  expect(new FrameBytes([]).sizeFor("##").toString()).toEqual("0");
  expect(new FrameBytes([0, 255]).sizeFor("##").toString()).toEqual("2");
  const blob = new FrameBlob("0b0001");
  expect(blob.sizeFor("##").toString()).toEqual("4");
  expect(blob.toString()).toEqual("0b0001");
  // There is no valid zero-width blob constructor/literal; empty bytes cover zero.
});

Deno.test("reference chains refuse cycles before entering the aggregate Size walk", () => {
  const value = new FrameCount(7n);
  const left = new FrameHandle(value, false);
  const right = new FrameHandle(left, false);
  expect(right.referent()).toBe(value);
  expect(right.sizeFor("##").toString()).toEqual("7");
  expect(new FrameArray([right, right]).sizeFor("##").toString()).toEqual("14");
  const alias = new FrameAlias("value");
  expect(alias.referent()).toBe(alias); // Aliases are setter syntax, not referent edges.
  expect(new FrameHandle(alias, false).sizeFor("##").toString()).toEqual("1");

  // Mirrors the existing frame-handle.test.ts lookup fixture. No HC source
  // operation exposes target retargeting; reflection can still build this graph.
  Reflect.set(left, "target", right);
  for (const handle of [left, right]) {
    expect(handle.referent().toString()).toEqual("$!.cyclic-reference");
    expect(handle.sizeFor("##").toString()).toEqual("$!.cyclic-reference");
    expect(handle.nativeSize(new Set()).toString()).toEqual(
      "$!.cyclic-reference",
    );
    expect(handle.sizeFor("###").toString()).toEqual("$!.cyclic-reference");
    const array = new FrameArray([handle]);
    expect(array.sizeFor("##").toString()).toEqual("$!.cyclic-reference");
    expect(array.sizeFor("###").toString()).toEqual("$!.cyclic-reference");
    expect(array.sizeFor("#").toString()).toEqual("1");
  }
  expect(left.unwrap()).toBe(right);
  expect(right.unwrap()).toBe(left); // Observation leaves the graph untouched.

  // Scope wrappers are the other built-in transparent referent implementation.
  const scoped = new FrameScoped(left, EvaluationScope.from([]));
  Reflect.set(left, "target", scoped);
  expect(scoped.referent().toString()).toEqual("$!.cyclic-reference");
  expect(new FrameArray([scoped]).sizeFor("###").toString()).toEqual(
    "$!.cyclic-reference",
  );
  Reflect.set(scoped, "term", scoped);
  expect(scoped.sizeFor("##").toString()).toEqual("$!.cyclic-reference");
  expect(scoped.nativeSize(new Set()).toString()).toEqual(
    "$!.cyclic-reference",
  );
  expect(scoped.sizeFor("###").toString()).toEqual("$!.cyclic-reference");
  expect(Frame.error("$!.stored-error").sizeFor("##").toString()).toEqual(
    "$!.stored-error",
  );
});

Deno.test("FOIST 19a third hash preserves raw ordered immediate Sizes", () => {
  const value = new FrameArray([new FrameCount(5n), new FrameString("hello")]);
  expect(value.sizeFor("#").toString()).toEqual("2");
  expect(value.sizeFor("##").toString()).toEqual("10");
  const raw = tryDenumState(value.sizeFor("###"));
  expect(raw?.count).toEqual(2n);
  expect(raw?.loads).toEqual([5n, 5n]);
  expect(value.sizeFor("####").toString()).toEqual("[0]");
  expect(value.toString()).toEqual("[5, “hello”]");
});

Deno.test("FOIST 19a appending changes KD orientation without mutating prefix", () => {
  const prefix = new FrameArray([new FrameCount(3n), new FrameCount(1n)]);
  const extended = new FrameArray([...prefix.elements(), new FrameCount(5n)]);
  expect(prefix.sizeFor("####").toString()).toEqual("[2]");
  expect(extended.sizeFor("####").toString()).toEqual("[-2, 1]");
  expect(tryDenumState(prefix.sizeFor("###"))?.loads).toEqual([3n, 1n]);
  expect(tryDenumState(extended.sizeFor("###"))?.loads).toEqual([3n, 1n, 5n]);
});

Deno.test("FOIST 19a recursive Size and raw Denum propagate cycle errors", () => {
  const a = new FrameArray([]);
  a.collect(a);
  expect(a.sizeFor("#").toString()).toEqual("1");
  expect(a.sizeFor("##").toString()).toContain("cyclic-aggregate");
  expect(a.sizeFor("###").toString()).toContain("cyclic-aggregate");
  expect(a.sizeFor("####").toString()).toContain("cyclic-aggregate");
});

Deno.test("FOIST 19a distinguishes nil from zero-arity and zero-load Denums", () => {
  expect(Frame.nil.sizeFor("###")).toBe(Frame.nil);
  expect(Frame.nil.sizeFor("####")).toBe(Frame.nil);
  const empty = new FrameArray([]);
  const raw = tryDenumState(empty.sizeFor("###"));
  expect(raw).toEqual({ count: 0n, loads: [] });
  expect(empty.sizeFor("####").toString()).toEqual("[]");
  const oneZero = new FrameArray([new FrameCount(0n)]);
  expect(tryDenumState(oneZero.sizeFor("###"))).toEqual({
    count: 1n,
    loads: [0n],
  });
  expect(oneZero.sizeFor("####").toString()).toEqual("[0]");
});
