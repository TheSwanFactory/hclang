import { expect } from "jsr:@std/expect@^0.219.1";
import { describe, it } from "jsr:@std/testing@^1.0.10/bdd";

import { Frame, FrameLazy } from "../frames.ts";
import type { ReceiverState } from "../frames/bound-method.ts";
import { FrameCurry } from "./frame-curry.ts";

const stateFor = (receiver = new Frame()): ReceiverState => ({
  receiver,
  mutable: true,
});

const inlineCallback = (
  state: ReceiverState,
  source = new FrameLazy([Frame.nil]),
): Frame => {
  const invocation = new Frame();
  invocation.receiverState = state;
  return source.in([invocation]);
};

describe("FrameCurry", () => {
  it("forwards state to a callback evaluated in the same invocation", () => {
    const state = stateFor();
    const original = new FrameLazy([Frame.nil]);
    const callback = inlineCallback(state, original);
    let seen: ReceiverState | undefined;
    const curry = new FrameCurry(
      (_source, _block, receiverState) => {
        seen = receiverState;
        return Frame.nil;
      },
      Frame.all,
      "?",
    ).withReceiverState(state);

    curry.call(callback);

    expect(callback).not.toBe(original);
    expect(seen).toBe(state);
  });

  it("withholds state from an unrelated named helper", () => {
    const state = stateFor();
    const helper = new FrameLazy([Frame.nil]);
    let seen: ReceiverState | undefined;
    const curry = new FrameCurry(
      (_source, _block, receiverState) => {
        seen = receiverState;
        return Frame.nil;
      },
      Frame.all,
      "?",
    ).withReceiverState(state);

    curry.call(helper);

    expect(seen).toBeUndefined();
  });

  it("withholds state from a callback marked by another invocation", () => {
    const captured = stateFor();
    const other = stateFor();
    const callback = inlineCallback(other);
    let seen: ReceiverState | undefined;
    const curry = new FrameCurry(
      (_source, _block, receiverState) => {
        seen = receiverState;
        return Frame.nil;
      },
      Frame.all,
      "?",
    ).withReceiverState(captured);

    curry.call(callback);

    expect(seen).toBeUndefined();
  });
});
