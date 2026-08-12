import { expect } from "jsr:@std/expect@^0.219.1";
import { describe, it } from "jsr:@std/testing@^1.0.10/bdd";

import { Frame, FrameSymbol } from "../frames.ts";
import { Sigilizer } from "./sigilizer.ts";

class RecordingReceiver extends Frame {
  public readonly received: string[] = [];

  public override call(argument: Frame): Frame {
    this.received.push(argument.toString());
    return this;
  }
}

describe("Sigilizer", () => {
  it("forwards Symbols in order and preserves the returned receiver", () => {
    const phase = new Sigilizer();
    const receiver = new RecordingReceiver();

    const afterA = phase.scan(receiver, FrameSymbol.for("a"));
    const afterB = phase.scan(afterA, FrameSymbol.for("b"));

    expect(afterB).toBe(receiver);
    expect(receiver.received).toEqual(["a", "b"]);
  });

  it("retains no per-input state", () => {
    const phase = new Sigilizer();
    const first = new RecordingReceiver();
    const second = new RecordingReceiver();

    phase.scan(first, FrameSymbol.for("a"));
    phase.scan(second, FrameSymbol.for("b"));

    expect(Object.keys(phase)).toEqual([]);
    expect(first.received).toEqual(["a"]);
    expect(second.received).toEqual(["b"]);
  });
});
