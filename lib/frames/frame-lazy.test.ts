import { expect } from "jsr:@std/expect@^0.219.1";
import { describe, it } from "jsr:@std/testing@^1.0.10/bdd";

import * as frame from "../frames.ts";
import type { ReceiverState } from "./bound-method.ts";

describe("FrameLazy", () => {
  const slow = new frame.FrameString("slow");
  const space = new frame.FrameString(" ");
  const turtle = new frame.FrameString("turtle");

  const lazy_array = [
    new frame.FrameSymbol("speed"),
    new frame.FrameSymbol("gap"),
    frame.FrameArg.here(),
  ];
  const lazy = new frame.FrameLazy(lazy_array, { speed: slow });
  const context = new frame.FrameString("context", { gap: space });

  it("takes an Array<Frame>", () => {
    expect(lazy).toBeInstanceOf(frame.FrameLazy);
  });

  it("stringifies to {expr} without metadata", () => {
    const result = lazy.toString();
    // Closures don't show captured metadata in toString (use inspect() for that)
    expect(result).toEqual("{ speed gap _ }");
  });

  it("retains a live parent context and stays lazy until called", () => {
    const result = lazy.in([context]) as frame.FrameLazy;

    expect(result).not.toBe(lazy);
    expect(lazy.up).toBe(frame.Frame.missing);
    expect(result.get("speed")).toEqual(slow);
    expect(result.get("gap")).toEqual(space);
    // Closures don't show captured metadata in toString
    expect(result.toString()).toEqual("{ speed gap _ }");
    // Own metadata remains inspectable; inherited metadata is not copied.
    expect(result.inspect()).toContain(".speed");
    expect(result.meta.gap).toBeUndefined();
    expect(result.call(turtle).toString()).toEqual("\u201cslow turtle\u201d");
    context.set("gap", new frame.FrameString("-"));
    expect(result.call(turtle).toString()).toEqual("“slow-turtle”");
  });

  it("keeps captures and shared body ancestry stable across calls", () => {
    const symbol = new frame.FrameSymbol("captured");
    const body = new frame.FrameExpr([symbol]);
    const syntaxParent = new frame.FrameString("syntax parent");
    body.up = syntaxParent;
    symbol.up = syntaxParent;

    const template = new frame.FrameLazy([body]);
    const firstScope = new frame.Frame({
      captured: new frame.FrameNumber("1"),
    });
    const secondScope = new frame.Frame({
      captured: new frame.FrameNumber("2"),
    });
    const first = template.in([firstScope]) as frame.FrameLazy;
    const second = template.in([secondScope]) as frame.FrameLazy;

    expect([
      first.call(frame.Frame.nil).toString(),
      second.call(frame.Frame.nil).toString(),
      first.call(frame.Frame.nil).toString(),
    ]).toEqual(["1", "2", "1"]);
    expect(first).not.toBe(second);
    expect(template.up).toBe(frame.Frame.missing);
    expect(body.up).toBe(syntaxParent);
    expect(symbol.up).toBe(syntaxParent);
  });

  describe("Codify", () => {
    const codify = new frame.FrameLazy([]);
    const fast = new frame.FrameString("fast");

    it("is created with an empty Array", () => {
      expect(codify.toString()).toEqual("{}");
    });

    it("returns a bound copy when evaluated", () => {
      const bound = codify.in([context]);
      expect(bound).toBeInstanceOf(frame.FrameLazy);
      expect(bound).not.toBe(codify);
      expect(codify.up).toBe(frame.Frame.missing);
    });

    it("converts Array to unevaluated Expr when called", () => {
      const array = new frame.FrameArray(lazy_array, {
        speed: fast,
        gap: space,
      });
      const codified = codify.call(array);

      expect(codified).toBeInstanceOf(frame.FrameExpr);
      // Check that output contains the key elements (exact format may vary)
      const result = codified.toString();
      expect(result).toContain("speed");
      expect(result).toContain("gap");
      expect(result).toContain("_");
      expect(codified.call(turtle).toString()).toEqual("“fast turtle”");
    });

    it("does not copy caller metadata into the codified expression", () => {
      const scopedCodify = new frame.FrameLazy([], {
        "; ": new frame.FrameString("source"),
      });
      const codified = scopedCodify.call(new frame.FrameArray([turtle]));

      expect(codified.toString()).toEqual("(“turtle”)");
      expect(codified.meta_length()).toEqual(0);
    });

    it("treats other Frames as Arrays when called", () => {
      const wrap = codify.call(turtle);

      expect(wrap).toBeInstanceOf(frame.FrameExpr);
      expect(wrap.call(frame.Frame.nil).toString()).toEqual("“turtle”");
    });
  });

  describe("receiver", () => {
    const body = [new frame.FrameSymbol("field")];

    it("resolves a body against the receiver it was called with", () => {
      const method = new frame.FrameLazy([...body]);
      const receiver = new frame.FrameArray([], {
        field: new frame.FrameString("mine"),
      });

      const receiverState: ReceiverState = { receiver, mutable: false };
      const result = method.call(
        frame.Frame.nil,
        frame.Frame.nil,
        receiverState,
      );

      expect(result.toString()).toEqual("“mine”");
    });

    it("neither copies nor mutates the shared closure", () => {
      const method = new frame.FrameLazy([...body]);
      const captured = new frame.FrameString("definition scope");
      method.up = captured;
      const first = new frame.FrameArray([], {
        field: new frame.FrameString("first"),
      });
      const second = new frame.FrameArray([], {
        field: new frame.FrameString("second"),
      });

      const one = method.call(frame.Frame.nil, frame.Frame.nil, {
        receiver: first,
        mutable: false,
      });
      const two = method.call(frame.Frame.nil, frame.Frame.nil, {
        receiver: second,
        mutable: false,
      });

      // Each call sees its own receiver, and the closure keeps the scope it
      // captured at definition rather than the last receiver bound to it.
      expect(one.toString()).toEqual("“first”");
      expect(two.toString()).toEqual("“second”");
      expect(method.up).toBe(captured);
      expect(method.receiverState).toBeUndefined();
    });

    it("keeps the receiver for a scope nested inside the body", () => {
      const nested = new frame.FrameGroup([
        new frame.FrameExpr([new frame.FrameSymbol("field")]),
      ]);
      const method = new frame.FrameLazy([nested]);
      const receiver = new frame.FrameArray([], {
        field: new frame.FrameString("outer receiver"),
      });

      const receiverState: ReceiverState = { receiver, mutable: false };
      const result = method.call(
        frame.Frame.nil,
        frame.Frame.nil,
        receiverState,
      );

      expect(result.toString()).toEqual("“outer receiver”");
    });
  });
});
