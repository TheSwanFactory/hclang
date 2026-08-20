import { expect } from "jsr:@std/expect@^0.219.1";
import { describe, it } from "jsr:@std/testing@^1.0.10/bdd";

import {
  Frame,
  FrameAlias,
  FrameArray,
  FrameLazy,
  FrameString,
} from "../frames.ts";
import {
  authorizedReceiverWriteTarget,
  BoundMethod,
  type ReceiverState,
} from "./bound-method.ts";

class CapturingLazy extends FrameLazy {
  public seen?: ReceiverState;

  constructor() {
    super([Frame.nil]);
  }

  public override call(
    _argument: Frame,
    _parameter = Frame.nil,
    receiverState?: ReceiverState,
  ): Frame {
    this.seen = receiverState;
    return Frame.nil;
  }
}

describe("BoundMethod", () => {
  const original = new FrameString("original");
  const replacement = new FrameString("replacement");

  const writer = (): FrameLazy =>
    new FrameLazy([new FrameAlias("value"), replacement]);

  it("does not accept look-alike receiver state as write authority", () => {
    const receiver = new FrameArray([]);
    const forged = { receiver, mutable: true };

    expect(authorizedReceiverWriteTarget(undefined)).toBeUndefined();
    expect(authorizedReceiverWriteTarget(forged)).toBeUndefined();
    expect(
      authorizedReceiverWriteTarget({ receiver: "not a Frame", mutable: true }),
    ).toBeUndefined();
  });

  it("passes one branded receiver state to a mutating method", () => {
    const receiver = new FrameArray([]);
    const method = new CapturingLazy();

    const result = new BoundMethod(method, receiver, true, "write:").call(
      Frame.nil,
    );

    expect(result).toBe(receiver);
    expect(method.seen?.receiver).toBe(receiver);
    expect(authorizedReceiverWriteTarget(method.seen)).toBe(receiver);
  });

  it("withholds write authority from a non-mutating method", () => {
    const receiver = new FrameArray([], { value: original });

    const result = new BoundMethod(writer(), receiver, true, "write").call(
      Frame.nil,
    );

    expect(result.toString()).toEqual("$!.method-not-mutating @value");
    expect(receiver.get_here("value")).toBe(original);
  });

  it("mutates a mutable receiver in place", () => {
    const receiver = new FrameArray([], { value: original });

    const result = new BoundMethod(writer(), receiver, true, "write:").call(
      Frame.nil,
    );

    expect(result).toBe(receiver);
    expect(receiver.get_here("value")).toBe(replacement);
  });

  it("updates an immutable receiver through an isolated copy", () => {
    const receiver = new FrameArray([], { value: original });

    const result = new BoundMethod(writer(), receiver, false, "write:").call(
      Frame.nil,
    );

    expect(result).not.toBe(receiver);
    expect(result.get_here("value")).toBe(replacement);
    expect(receiver.get_here("value")).toBe(original);
  });

  it("refuses to mint authority outside an inherited copy boundary", () => {
    const receiver = new FrameArray([], { value: original });
    const method = new CapturingLazy();
    const copiedGraph = new WeakSet<Frame>();

    const result = new BoundMethod(
      method,
      receiver,
      true,
      "write:",
      copiedGraph,
    ).call(Frame.nil);

    expect(result.toString()).toEqual("$!.copy-on-write-boundary .write");
    expect(method.seen).toBeUndefined();
    expect(receiver.get_here("value")).toBe(original);
  });

  it("allows a mutable target owned by the copied graph", () => {
    const receiver = new FrameArray([], { value: original });
    const copiedGraph = new WeakSet<Frame>([receiver]);

    const result = new BoundMethod(
      writer(),
      receiver,
      true,
      "write:",
      copiedGraph,
    ).call(Frame.nil);

    expect(result).toBe(receiver);
    expect(receiver.get_here("value")).toBe(replacement);
  });
});
