/**
 * FOIST 19a compatibility of raw Denumeration, KD observation and the native
 * Frame-family Size contract. Historical residual parity is no longer exposed.
 */
import { expect } from "jsr:@std/expect@^0.219.1";
import {
  Frame,
  FrameArray,
  FrameCount,
  FrameLazy,
  FrameResource,
  FrameString,
  MemoryStore,
} from "../frames.ts";
import { tryDenumState } from "./fourth-hash.ts";
// Install the evaluator-owned Denum constructor for direct Frame observers.
import "../execute/denum-prologue.ts";

Deno.test("FOIST 19a: primitive and aggregate Sizes are non-executing", () => {
  const five = new FrameCount(5n);
  const text = new FrameString("é😀");
  const array = new FrameArray([five, text]);
  expect(five.sizeFor("##").toString()).toEqual("5");
  expect(text.sizeFor("##").toString()).toEqual("2");
  expect(array.sizeFor("##").toString()).toEqual("7");
  expect(array.sizeFor("#").toString()).toEqual("2");
  expect(tryDenumState(array.sizeFor("###"))).toEqual({
    count: 2n,
    loads: [5n, 2n],
  });
  expect(array.sizeFor("####").toString()).toEqual("[3]");

  class Uncallable extends FrameLazy {
    public override call(): never {
      throw new Error("size must not execute a closure");
    }
  }
  const closure = new Uncallable([five, text]);
  expect(closure.sizeFor("##").toString()).toEqual("7");

  class Unreadable extends MemoryStore {
    public override read(): never {
      throw new Error("size must not read a resource");
    }
  }
  const root = FrameResource.root(new Unreadable());
  expect(root.sizeFor("##").toString()).toEqual("1");
});

Deno.test("FOIST 19a: identity sharing preserves raw multiplicities", () => {
  const shared = new FrameArray([new FrameCount(3n)]);
  const both = new FrameArray([shared, shared]);
  expect(both.sizeFor("##").toString()).toEqual("6");
  expect(tryDenumState(both.sizeFor("###"))).toEqual({
    count: 2n,
    loads: [3n, 3n],
  });
  expect(both.sizeFor("####").toString()).toEqual("[0]");
  expect(both.elements()[0]).toBe(both.elements()[1]);
});

Deno.test("FOIST 19a: cycles and failed child observations propagate", () => {
  const cycle = new FrameArray([]);
  cycle.collect(cycle);
  expect(cycle.sizeFor("##").toString()).toContain("cyclic-aggregate");
  expect(cycle.sizeFor("###").toString()).toContain("cyclic-aggregate");
  expect(cycle.sizeFor("####").toString()).toContain("cyclic-aggregate");

  const refused = Frame.error("$!.denum-compatibility");
  const host = new FrameArray([refused]);
  expect(host.sizeFor("##").toString()).toContain("denum-compatibility");
  expect(host.sizeFor("###").toString()).toContain("denum-compatibility");
});
