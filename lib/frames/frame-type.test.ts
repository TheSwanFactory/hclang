import { expect } from "@std/expect";
import { describe, it } from "@std/testing/bdd";
import {
  Frame,
  FrameCount,
  FrameDecimal,
  FrameInt,
  FrameNumber,
  type FrameNumeric,
  FrameOperator,
  FrameRational,
  FrameResource,
  FrameSequence,
  FrameString,
  FrameSymbol,
  FrameType,
  FrameTypedNumber,
  FrameURI,
  MemoryStore,
} from "../frames.ts";
import { lastResult as answer } from "../test-helpers.test.ts";

describe("FrameType", () => {
  it("represents and matches an extracted runtime frame class", () => {
    const type = FrameType.of(new FrameString(""));

    expect(type.toString()).toEqual("(“”).<>");
    expect(type.matches(new FrameString("Q"))).toEqual(true);
    expect(type.matches(new FrameNumber("1"))).toEqual(false);
  });

  it("returns evidence on application and an error on mismatch", () => {
    const type = FrameType.of(new FrameString(""));
    const string = new FrameString("Q");

    expect(type.call(string)).toEqual(string);
    expect(type.call(new FrameNumber("1")).toString()).toEqual(
      "$!.type-error (“”).<> 1",
    );
  });
  it("prints inside an aggregate's data plane as its own form", () => {
    expect(answer("[1 .<>]").dataString()).toEqual("[(1).<>]");
    expect(answer("[1 .<>]").dataEquals(answer("[1 .<>]"))).toBe(Frame.all);
    expect(answer("[1 .<>]").dataEquals(answer("[“a” .<>]")))
      .toBe(Frame.nil);
  });
  describe("numeric membership (#410)", () => {
    // One value per rung, lowest first: count, int, decimal, rational, number.
    const rungs: FrameNumeric[] = [
      new FrameCount(2n),
      new FrameInt(-1n),
      new FrameDecimal("1.5"),
      new FrameRational(1n, 2n),
      new FrameNumber(1 / 3),
    ];
    it("admits a value from the type's own rung or any lower rung", () => {
      rungs.forEach((typeRung, typeIndex) => {
        const type = FrameType.of(typeRung);
        rungs.forEach((valueRung, valueIndex) => {
          expect([typeIndex, valueIndex, type.matches(valueRung)]).toEqual([
            typeIndex,
            valueIndex,
            valueIndex <= typeIndex,
          ]);
        });
      });
    });
    it("binds the admitted value unchanged", () => {
      const count = new FrameCount(3n);
      expect(FrameType.of(new FrameDecimal("1.5")).call(count)).toBe(count);
    });
    it("keeps unranked numerics exact", () => {
      const sequence = new FrameSequence("1.408.555");
      const typed = new FrameTypedNumber(new FrameDecimal("9.8"), "m");
      for (const unranked of [sequence, typed]) {
        const type = FrameType.of(unranked);
        expect(type.matches(unranked)).toBe(true);
        for (const rung of rungs) {
          expect(type.matches(rung)).toBe(false);
          expect(FrameType.of(rung).matches(unranked)).toBe(false);
        }
      }
      expect(FrameType.of(sequence).matches(typed)).toBe(false);
      expect(FrameType.of(typed).matches(sequence)).toBe(false);
    });
    it("keeps every other subclass pair exact", () => {
      const resource = FrameResource.root(new MemoryStore());
      const uri = new FrameURI("https://example.com/");
      expect(resource).toBeInstanceOf(FrameURI);
      expect(FrameType.of(uri).matches(resource)).toBe(false);
      expect(FrameType.of(resource).matches(uri)).toBe(false);
      const operator = new FrameOperator("+");
      const symbol = new FrameSymbol("x");
      expect(operator).toBeInstanceOf(FrameSymbol);
      expect(FrameType.of(symbol).matches(operator)).toBe(false);
      expect(FrameType.of(operator).matches(symbol)).toBe(false);
    });
  });
});
