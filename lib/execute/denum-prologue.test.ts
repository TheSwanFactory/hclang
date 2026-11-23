import { expect } from "jsr:@std/expect@^0.219.1";
import { Frame, FrameArray, FrameExpr } from "../frames.ts";
import { FrameHandle } from "../frames/frame-handle.ts";
import { HC_SOURCES } from "../bundle/hc-sources.ts";
import { evaluate } from "./evaluate.ts";
import {
  constructDenum,
  DENUM_SOURCE,
  denumClass,
  loadDenumClass,
} from "./denum-prologue.ts";
import {
  observeDenum,
  observeKDCoordinates,
  tryDenumState,
} from "../frames/fourth-hash.ts";
import {
  answerOfLast as value,
  countOf as count,
  denumOf as denum,
} from "../test-helpers.test.ts";

const state = (d: Frame): { count: bigint; loads: readonly bigint[] } => {
  const observed = tryDenumState(d);
  if (!observed) throw new Error("not a genuine Denum: " + d);
  return observed;
};

Deno.test("FOIST 19a: the third hash installs the HC class in a bare evaluator", () => {
  expect(evaluate("X <- './hc/denum.hc'; X").toString()).toContain("$!");
  expect(state(value("[5, 3, 7].###"))).toEqual({
    count: 3n,
    loads: [5n, 3n, 7n],
  });
  expect(denumClass().className()).toEqual("FrameLazy");
  expect(HC_SOURCES.has(DENUM_SOURCE)).toEqual(true);
  expect(observeKDCoordinates(value("[5, 3, 7].###")).toString())
    .toEqual("[-2, 3]");
});

Deno.test("FOIST 19a: genuine Denum Count and arity are independent", () => {
  const d = denum(123n, [3n, 1n]);
  expect(state(d)).toEqual({ count: 123n, loads: [3n, 1n] });
  expect(state(d.sizeFor("###"))).toEqual(state(d));
  expect(d.sizeFor("####").toString()).toEqual("[2]");
  expect(denum(2n, [3n, 1n]).equals(d)).toBe(Frame.nil);
  expect(d.sizeFor("#").toString()).toEqual("123");
  expect(d.sizeFor("##").toString()).toEqual("4");
});

Deno.test("FOIST 19a: canonical empty Denum and zero-arity application", () => {
  const empty = denum(0n, []);
  expect(state(empty)).toEqual({ count: 0n, loads: [] });
  expect(empty.sizeFor("####").toString()).toEqual("[]");
  const applied = FrameExpr.answeredValue(
    new FrameHandle(empty, false).call(count(3n)),
  ).referent();
  expect(state(applied)).toEqual({ count: 1n, loads: [3n] });
  expect(state(empty)).toEqual({ count: 0n, loads: [] });
  expect(state(denum(0n, [3n, 1n]))).toEqual({
    count: 0n,
    loads: [3n, 1n],
  });
  expect(constructDenum(count(2n), []).toString()).toContain("invalid-denum");
});

Deno.test("FOIST 19a: application routes by Count modulo raw load arity", () => {
  const d = denum(2n, [3n, 1n]);
  const applied = FrameExpr.answeredValue(
    new FrameHandle(d, false).call(count(5n)),
  ).referent();
  expect(state(applied)).toEqual({ count: 3n, loads: [8n, 1n] });
  const next = FrameExpr.answeredValue(
    new FrameHandle(applied, false).call(count(7n)),
  ).referent();
  expect(state(next)).toEqual({ count: 4n, loads: [8n, 8n] });
  expect(state(d)).toEqual({ count: 2n, loads: [3n, 1n] });
});

Deno.test("FOIST 19a: raw Denumeration preserves instances, not forged fields", () => {
  const d = denum(4n, [3n, 1n]);
  expect(state(observeDenum(d))).toEqual(state(d));
  expect(observeDenum(d)).not.toBe(d);
  const forged = new FrameArray([]);
  forged.set("count", count(4n));
  forged.set("loads", new FrameArray([count(3n), count(1n)]));
  expect(tryDenumState(forged)).toBeUndefined();
  expect(state(observeDenum(forged))).toEqual({
    count: 0n,
    loads: [],
  });
});

Deno.test("FOIST 19a: constructor and class-load failures are explicit", () => {
  expect(loadDenumClass(undefined).toString()).toEqual(
    "$!.denum-prologue-missing hc/denum.hc",
  );
  expect(loadDenumClass(".Other {[]};").toString())
    .toEqual("$!.denum-prologue-missing Denum");
  expect(constructDenum(count(2n), []).toString())
    .toContain("invalid-denum");
  expect(
    constructDenum(count(2n), [count(1n), count(0n)])
      .isFailedResult(),
  ).toBe(false);
});

Deno.test("FOIST 19a: a genuine Denum's state is its construction Count and loads", () => {
  expect(state(denum(7n, [3n, 1n]))).toEqual({
    count: 7n,
    loads: [3n, 1n],
  });
});
