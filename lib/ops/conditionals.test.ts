import { expect } from "jsr:@std/expect@^0.219.1";
import { describe, it } from "jsr:@std/testing@^1.0.10/bdd";

import { Frame } from "../frames.ts";
import type { ReceiverState } from "../frames/bound-method.ts";
import { IfElse, IfThen } from "./conditionals.ts";

class CapturingBlock extends Frame {
  public calls = 0;
  public seen?: ReceiverState;

  public override call(
    _argument: Frame,
    _parameter = Frame.nil,
    receiverState?: ReceiverState,
  ): Frame {
    this.calls += 1;
    this.seen = receiverState;
    return Frame.all;
  }
}

describe("conditionals", () => {
  const receiverState: ReceiverState = {
    receiver: new Frame(),
    mutable: false,
  };

  it("forwards receiver state only to a selected then block", () => {
    const selected = new CapturingBlock();
    const skipped = new CapturingBlock();

    expect(IfThen(Frame.all, selected, receiverState)).toBe(Frame.all);
    expect(selected.seen).toBe(receiverState);
    expect(IfThen(Frame.nil, skipped, receiverState)).toBe(Frame.nil);
    expect(skipped.calls).toEqual(0);
  });

  it("forwards receiver state only to a selected else block", () => {
    const selected = new CapturingBlock();
    const skipped = new CapturingBlock();

    expect(IfElse(Frame.nil, selected, receiverState)).toBe(Frame.all);
    expect(selected.seen).toBe(receiverState);
    expect(IfElse(Frame.all, skipped, receiverState)).toBe(Frame.nil);
    expect(skipped.calls).toEqual(0);
  });
});
