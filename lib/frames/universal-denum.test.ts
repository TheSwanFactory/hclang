/**
 * FOIST 19a observer contract across Frames, including zero arity, sharing,
 * exact Counts, gauge, and error propagation. The old alternating residual
 * and two-load reconstruction are no longer public observers.
 */
import { expect } from "@std/expect";
import { Frame, FrameArray, FrameCount, FrameString } from "../frames.ts";
import { constructDenum } from "../execute/denum-prologue.ts";
import {
  multiplyDenum,
  negateDenum,
  observeDenum,
  tryDenumState,
} from "./fourth-hash.ts";

const counts = (...ns: bigint[]): FrameArray =>
  new FrameArray(ns.map((n) => new FrameCount(n)));

const state = (frame: Frame): { count: bigint; loads: readonly bigint[] } => {
  const observed = tryDenumState(frame);
  if (!observed) throw new Error("not a raw Denum: " + frame);
  return observed;
};

Deno.test("FOIST 19a: immediate child Sizes construct unnormalized Denums", () => {
  const xs = new FrameArray([new FrameCount(5n), new FrameString("hello")]);
  expect(state(xs.sizeFor("###"))).toEqual({
    count: 2n,
    loads: [5n, 5n],
  });
  expect(xs.sizeFor("####").toString()).toEqual("[0]");
  expect(xs.sizeFor("#").toString()).toEqual("2");
  expect(xs.sizeFor("##").toString()).toEqual("10");
});

Deno.test("FOIST 19a: Count-zero and nil are distinct from zero load", () => {
  expect(Frame.nil.sizeFor("###")).toBe(Frame.nil);
  expect(Frame.nil.sizeFor("####")).toBe(Frame.nil);
  const empty = counts();
  expect(state(empty.sizeFor("###"))).toEqual({ count: 0n, loads: [] });
  expect(empty.sizeFor("####").toString()).toEqual("[]");
  const singleZero = counts(0n);
  expect(state(singleZero.sizeFor("###"))).toEqual({
    count: 1n,
    loads: [0n],
  });
  expect(singleZero.sizeFor("####").toString()).toEqual("[0]");
});

Deno.test("FOIST 19a: Denum Count is independent of loads and KD rank", () => {
  const d = constructDenum(new FrameCount(123n), [
    new FrameCount(3n),
    new FrameCount(1n),
  ]);
  expect(state(d.sizeFor("###"))).toEqual({
    count: 123n,
    loads: [3n, 1n],
  });
  expect(d.sizeFor("####").toString()).toEqual("[2]");
  expect(state(d)).toEqual({ count: 123n, loads: [3n, 1n] });
});

Deno.test("FOIST 19a: positive gauge shifts do not change observed coordinates", () => {
  const d = counts(3n, 1n);
  const shift = counts(7n, 5n);
  expect(d.sizeFor("####").toString()).toEqual("[2]");
  expect(shift.sizeFor("####").toString()).toEqual("[2]");
  expect(state(d.sizeFor("###")).loads).not.toEqual(
    state(shift.sizeFor("###")).loads,
  );
});

Deno.test("FOIST 19a: half-turn negation preserves Count and reverses KD sign", () => {
  const raw = constructDenum(new FrameCount(9n), [
    new FrameCount(3n),
    new FrameCount(1n),
    new FrameCount(5n),
  ]);
  const neg = negateDenum(raw);
  expect(neg).toBeDefined();
  expect(state(neg!)).toEqual({
    count: 9n,
    loads: [5n, 0n, 3n, 1n],
  });
  expect(neg!.sizeFor("####").toString()).toEqual("[2, -1]");
  expect(raw.sizeFor("####").toString()).toEqual("[-2, 1]");
});

Deno.test("FOIST 19a: signed-XOR product retains nonnegative loads", () => {
  const negOne = constructDenum(new FrameCount(2n), [
    new FrameCount(0n),
    new FrameCount(1n),
  ]);
  const squared = multiplyDenum(negOne, negOne);
  expect(state(squared)).toEqual({ count: 4n, loads: [1n, 0n] });
  expect(squared.sizeFor("####").toString()).toEqual("[1]");
});

Deno.test("FOIST 19a: sharing is counted per occurrence, cycles propagate", () => {
  const shared = counts(3n, 1n);
  const parent = new FrameArray([shared, shared]);
  expect(parent.sizeFor("##").toString()).toEqual("8");
  expect(state(observeDenum(parent))).toEqual({ count: 2n, loads: [4n, 4n] });
  const cycle = new FrameArray([]);
  cycle.collect(cycle);
  expect(cycle.sizeFor("##").toString()).toContain("cyclic-aggregate");
  expect(cycle.sizeFor("###").toString()).toContain("cyclic-aggregate");
});
