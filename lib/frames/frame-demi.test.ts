import { expect } from "jsr:@std/expect@^0.219.1";
import {
  EvaluationScope,
  Frame,
  FrameArray,
  FrameCount,
  FrameDemi,
  FrameInt,
  FrameNumber,
  FrameScoped,
  FrameString,
} from "../frames.ts";
import { FrameHandle } from "./frame-handle.ts";
import { Add, Multiply } from "../ops/math.ts";
import { evaluate } from "../execute/evaluate.ts";

const count = (n: bigint): FrameCount => new FrameCount(n);
const demi = (phase = Frame.nil, l = 1n, r = 0n): FrameDemi =>
  new FrameDemi(phase, count(l), count(r));

Deno.test("Demi validates exact native constructor inputs and HC factory failures", () => {
  for (
    const phase of [Frame.missing, new Frame(), Frame.nil.copy(), count(0n)]
  ) {
    expect(() => demi(phase)).toThrow(TypeError);
    expect(FrameDemi.create(phase, count(1n), count(0n)).is.error).toBe(true);
  }
  class CountSubclass extends FrameCount {}
  for (
    const load of [
      new FrameInt(1n),
      new FrameNumber(1.5),
      new CountSubclass(1n),
      Frame.nil,
    ]
  ) {
    expect(() => new FrameDemi(Frame.all, load as FrameCount, count(0n)))
      .toThrow(TypeError);
    expect(() => new FrameDemi(Frame.nil, count(0n), load as FrameCount))
      .toThrow(TypeError);
    expect(FrameDemi.create(Frame.all, load, count(0n)).is.error).toBe(true);
  }
  for (const invalid of [-1n, 1.5]) {
    const forged = count(1n);
    Reflect.set(forged, "data", invalid);
    expect(() => new FrameDemi(Frame.all, forged, count(0n))).toThrow(
      RangeError,
    );
    expect(FrameDemi.create(Frame.all, count(0n), forged).is.error).toBe(true);
    const d = demi();
    expect(() => d.addCount(forged)).toThrow(RangeError);
    expect(() => d.multiplyCount(forged)).toThrow(RangeError);
    for (const op of ["+", "*"]) {
      expect(evaluate(`$$.d ${op} $$.forged`, { d, forged }).at(0).toString())
        .toEqual(`$!.demi-operand ${op}`);
    }
  }
});

Deno.test("Demi keeps immutable magnitudes and present zero states", () => {
  const huge = 9007199254740993123456789n;
  const input = count(huge);
  const value = new FrameDemi(Frame.nil, input, count(0n));
  Reflect.set(input, "data", 0n);
  Reflect.set(value.left, "data", 1n);
  expect(Reflect.set(value, "orientation", Frame.all)).toBe(false);
  expect(Reflect.set(value, "left", count(0n))).toBe(false);
  expect(value.left.data).toEqual(huge);
  expect(value.orientation).toBe(Frame.nil);
  expect(Boolean(value.is.void)).toBe(false);
  expect(Boolean(demi(Frame.nil, 0n, 0n).is.void)).toBe(false);
  expect(demi(Frame.nil, 0n, 0n)).not.toBe(Frame.nil);
  expect(value.copy().encode()).toEqual(value.encode());
});

Deno.test("Demi exposes exact load quantities with explicit zero Count", () => {
  const huge = 9007199254740993123456789n;
  for (const phase of [Frame.all, Frame.nil]) {
    for (const [l, r] of [[0n, 0n], [0n, 3n], [huge, 2n], [2n, huge]]) {
      const value = demi(phase, l, r);
      value.set("ignored", new FrameArray([value]));
      for (
        const receiver of [
          value,
          value.copy(),
          new FrameHandle(value, false),
          new FrameScoped(value, EvaluationScope.from([])),
        ]
      ) {
        const size = receiver.sizeFor("##");
        const residual = receiver.sizeFor("###");
        expect(size).toBeInstanceOf(FrameCount);
        expect((size as FrameCount).data).toEqual(l + r);
        expect(residual).toBeInstanceOf(FrameInt);
        expect((residual as FrameInt).data).toEqual(l - r);
        expect(receiver.sizeFor("#").toString()).toEqual("0");
        expect(receiver.sizeFor("####")).toBe(Frame.nil);
        expect(new FrameArray([receiver]).nativeSize(new Set())).toEqual(l + r);
      }
    }
  }
  for (const source of ["7", "[[],[]]", "[0]", "[<2,3,5>,2]"]) {
    for (const key of ["##", "###"]) {
      expect(evaluate(`${source}.####.${key}`).at(0).toString()).toEqual(
        evaluate(`${source}.${key}`).at(0).toString(),
      );
    }
    expect(evaluate(`${source}.####.#`).at(0).toString()).toEqual("0");
    expect(evaluate(`${source}.####.####`).toString()).toEqual("[]");
  }
});

Deno.test("Demi scalar arithmetic covers both phases, zero, bigint and unchanged inputs", () => {
  const huge = 9007199254740993123456789n;
  for (const phase of [Frame.all, Frame.nil]) {
    for (const k of [0n, 1n, huge]) {
      const value = demi(phase, huge, 3n);
      const scalar = count(k);
      const before = value.encode();
      const added = Add(value, scalar) as FrameDemi;
      const scaled = Multiply(value, scalar) as FrameDemi;
      expect(added).toBeInstanceOf(FrameDemi);
      expect(scaled).toBeInstanceOf(FrameDemi);
      expect(added.orientation).toBe(
        phase === Frame.all ? Frame.nil : Frame.all,
      );
      expect(added.left.data).toEqual(huge + (phase === Frame.all ? k : 0n));
      expect(added.right.data).toEqual(3n + (phase === Frame.nil ? k : 0n));
      expect(scaled.orientation).toBe(phase);
      expect(scaled.left.data).toEqual(huge * k);
      expect(scaled.right.data).toEqual(3n * k);
      expect(value.encode()).toEqual(before);
      expect(scalar.data).toEqual(k);
    }
  }
});

Deno.test("Demi arithmetic rejects coercion at HC boundary and preserves existing dispatch", () => {
  const d = demi();
  for (
    const rhs of [
      d,
      new FrameInt(2n),
      new FrameNumber(2),
      new FrameString("2"),
      new FrameArray([]),
    ]
  ) {
    for (const op of ["+", "*"]) {
      const result = evaluate(`$$.d ${op} $$.rhs`, { d, rhs }).at(0);
      expect(result.toString()).toEqual(`$!.demi-operand ${op}`);
    }
  }
  const wrapped = new FrameHandle(d, false);
  const scalar = new FrameScoped(count(2n), EvaluationScope.from([]));
  expect((Add(wrapped, scalar) as FrameDemi).encode()).toEqual([
    "all",
    "1",
    "2",
  ]);
  expect((Multiply(wrapped, scalar) as FrameDemi).encode()).toEqual([
    "nil",
    "2",
    "0",
  ]);
  expect(evaluate("$$.d + 2", { d }).at(0).dataEquals(d.addCount(count(2n))))
    .toBe(Frame.all);
  expect(evaluate("2 + 3").at(0).toString()).toEqual("5");
  expect(evaluate("2 * 3").at(0).toString()).toEqual("6");
  expect(evaluate("[] * [[], []]").at(0).toString()).toEqual("[[], []]");
  expect(evaluate("2 * []").at(0).toString()).toEqual("[[], []]");
  expect(Add(Frame.nil, count(2n))).toBe(Frame.nil);
  expect(Multiply(Frame.nil, count(2n)).is.error).toBe(true);
  expect(Add(count(2n), d)).toBe(Frame.nil);
  const repeated = Multiply(count(2n), d) as FrameArray;
  expect(repeated).toBeInstanceOf(FrameArray);
  expect(repeated.asArray()).toEqual([d, d]);
});

Deno.test("Demi equality compares fields and follows immutable metadata/identity policy", () => {
  const a = demi(Frame.nil, 7n, 2n);
  const b = demi(Frame.nil, 7n, 2n);
  expect(a).not.toBe(b);
  for (const op of ["=", "==", "==="]) {
    expect(evaluate(`$$.a ${op} $$.b`, { a, b }).at(0)).toBe(Frame.all);
  }
  for (
    const other of [
      demi(Frame.all, 7n, 2n),
      demi(Frame.nil, 8n, 2n),
      demi(Frame.nil, 7n, 3n),
      Frame.nil,
    ]
  ) {
    expect(a.dataEquals(other)).toBe(Frame.nil);
  }
  b.set("label", new FrameString("tag"));
  expect(a.dataEquals(b)).toBe(Frame.all);
  expect(a.equals(b)).toBe(Frame.nil);
  expect(a.identical(b)).toBe(Frame.nil);
  a.set("label", new FrameString("tag"));
  expect(a.equals(b)).toBe(Frame.all);
  expect(a.identical(b)).toBe(Frame.all);
  expect(a.addCount(count(0n)).metadataView()).toEqual({});
  expect(a.multiplyCount(count(0n)).metadataView()).toEqual({});
});

Deno.test("Demi encoding is exact data-only persistence, display is diagnostic", () => {
  const value = demi(Frame.nil, 9007199254740993123456789n, 0n);
  expect(value.toString()).toEqual("FrameDemi((),9007199254740993123456789,0)");
  const restored = FrameDemi.decode(JSON.parse(JSON.stringify(value.encode())));
  expect(restored.identical(value)).toBe(Frame.all);
  for (
    const invalid of [
      null,
      [],
      ["nil", "-1", "0"],
      ["nil", "01", "0"],
      ["all", 1, 0],
      ["other", "0", "0"],
      ["nil", "1.5", "0"],
    ]
  ) {
    expect(() => FrameDemi.decode(invalid)).toThrow(TypeError);
  }
});
