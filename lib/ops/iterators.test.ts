import { expect } from "jsr:@std/expect@^0.219.1";
import { describe, it } from "jsr:@std/testing@^1.0.10/bdd";

import * as frame from "../frames.ts";
import type { ReceiverState } from "../frames/bound-method.ts";
import {
  MapElements,
  MapMembers,
  ReduceElements,
  ReduceMembers,
} from "./iterators.ts";

const ints = (...values: number[]): frame.FrameArray =>
  new frame.FrameArray(values.map((value) => frame.FrameInt.for(`${value}`)));

describe("iterators", () => {
  const block = new frame.FrameString("Prefix: ");

  describe("& maps elements", () => {
    it("applies each element to the receiver and keeps the answers apart", () => {
      const result = ints(1, 2, 3).get("&").call(block);

      expect(result).toBeInstanceOf(frame.FrameArray);
      expect(result.toString()).toEqual(
        "[“Prefix: 1”, “Prefix: 2”, “Prefix: 3”]",
      );
    });

    it("treats anything which is not an aggregate as one element", () => {
      const result = frame.FrameInt.for("1").get("&").call(block);

      expect(result.toString()).toEqual("[“Prefix: 1”]");
    });

    it("supplies no address in the parameter slot", () => {
      class ParameterBlock extends frame.Frame {
        public override call(
          _argument: frame.Frame,
          parameter: frame.Frame,
        ): frame.Frame {
          return parameter;
        }
      }

      const result = MapElements(ints(7, 8), new ParameterBlock());

      expect(result.toString()).toEqual("[(), ()]");
    });

    it("answers an empty array for an empty source", () => {
      expect(MapElements(new frame.FrameArray([]), block).toString())
        .toEqual("[]");
    });
  });

  describe("| reduces elements", () => {
    it("keeps each answer as the receiver for the next element", () => {
      const source = ints(1, 2, 3);

      expect(source.get("|").call(new frame.FrameString("")).toString())
        .toEqual("“123”");
      expect(source.get("|").call(new frame.FrameArray([])).toString())
        .toEqual("[1, 2, 3]");
      expect(ints(1, 2, 4).get("|").call(frame.FrameInt.for("1")).toString())
        .toEqual("8");
    });

    it("answers nil for an empty source, whatever it started from", () => {
      const empty = new frame.FrameArray([]);

      expect(ReduceElements(empty, new frame.FrameString("seed")))
        .toEqual(frame.Frame.nil);
      expect(ReduceElements(empty, new frame.FrameArray([])))
        .toEqual(frame.Frame.nil);
    });

    it("threads a closure like any other receiver, and it is spent at once", () => {
      // A closure answers its body rather than something still holding the
      // rule, so the first element consumes it and the rest apply to its
      // answer: 1, then 1 * 2, then 2 * 3. Useless, not refused.
      const closure = new frame.FrameLazy([frame.FrameArg.here()]);

      expect(ReduceElements(ints(1, 2, 3), closure).toString()).toEqual("6");
    });
  });

  describe("&& and || widen the stream to tuples", () => {
    const properties = (): frame.FrameArray => {
      const source = new frame.FrameArray([frame.FrameInt.for("10")]);
      source.set("meta", frame.FrameInt.for("9"));
      return source;
    };

    it("pairs each visible property, then each element by index", () => {
      const result = MapMembers(
        properties(),
        new frame.FrameLazy([frame.FrameArg.here()]),
      );

      expect(result.toString()).toEqual("[[.meta, 9], [.0, 10]]");
    });

    it("keys a tuple with the symbol that addresses the member", () => {
      const result = MapMembers(
        ints(10, 20),
        new frame.FrameLazy([frame.FrameArg.here()]),
      );

      expect(result.at(0).at(0)).toBeInstanceOf(frame.FrameSymbol);
      expect(result.at(0).at(0).toString()).toEqual(".0");
    });

    it("reduces that same stream, threading as | does", () => {
      const result = ReduceMembers(properties(), new frame.FrameArray([]));

      expect(result.toString()).toEqual("[[.meta, 9], [.0, 10]]");
    });

    it("answers an empty array for a value with no members", () => {
      expect(MapMembers(new frame.FrameArray([]), block).toString())
        .toEqual("[]");
    });

    it("withholds the interpreter's own plumbing", () => {
      const source = new frame.FrameArray([]);
      source.set(frame.Frame.kOUT, new frame.Frame());
      source.set("shown", frame.FrameInt.for("1"));
      source.set("hidden.<>", new frame.Frame());
      source.set("_protected", frame.FrameInt.for("2"));

      expect(source.visibleKeys()).toEqual(["shown"]);
    });
  });

  it("forwards receiver state through every iterator callback", () => {
    class CapturingBlock extends frame.Frame {
      public readonly seen: Array<ReceiverState | undefined> = [];

      public override call(
        argument: frame.Frame,
        _parameter = frame.Frame.nil,
        receiverState?: ReceiverState,
      ): frame.Frame {
        this.seen.push(receiverState);
        return argument;
      }
    }

    const receiverState: ReceiverState = {
      receiver: new frame.Frame(),
      mutable: false,
    };
    const source = ints(1, 2);
    const blocks = [
      new CapturingBlock(),
      new CapturingBlock(),
      new CapturingBlock(),
      new CapturingBlock(),
    ];

    MapElements(source, blocks[0], receiverState);
    ReduceElements(source, blocks[1], receiverState);
    MapMembers(source, blocks[2], receiverState);
    ReduceMembers(source, blocks[3], receiverState);

    // A map calls once per member; a reduce calls once per member after the
    // seed, and answers the argument here, so the accumulator stays this block.
    expect(blocks[0].seen).toEqual([receiverState, receiverState]);
    expect(blocks[1].seen).toEqual([receiverState]);
    expect(blocks[2].seen).toEqual([receiverState, receiverState]);
    expect(blocks[3].seen).toEqual([receiverState]);
  });

  it("is curried using a name", () => {
    const curry = new frame.FrameExpr([
      frame.FrameArg.here(),
      new frame.FrameName("&&"),
    ]);

    expect(curry.call(ints(1)).toString()).toContain("FrameCurry");
  });
});
