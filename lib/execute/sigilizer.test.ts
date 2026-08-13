import { expect } from "jsr:@std/expect@^0.219.1";
import { describe, it } from "jsr:@std/testing@^1.0.10/bdd";

import { Frame, FrameSymbol } from "../frames.ts";
import { Scan, type ScanResponse, Sigilizer } from "./sigilizer.ts";

class RecordingReceiver extends Frame {
  public readonly received: string[] = [];

  public override call(argument: Frame): Frame {
    this.received.push(argument.toString());
    return this;
  }
}

class CompletingReceiver extends Frame {
  public completed = 0;

  public constructor(private readonly next: Frame) {
    super();
  }

  public override scan(_symbol: Frame): ScanResponse {
    return Scan.completeRedispatch();
  }

  public consumeScan(_symbol: Frame): Frame {
    return this;
  }

  public completeScan(_value: Frame | null): Frame {
    this.completed += 1;
    return this.next;
  }

  public transitionScan(next: Frame): Frame {
    return next;
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

  it("routes plain scan results and redispatches exactly once", () => {
    const phase = new Sigilizer();
    const next = new RecordingReceiver();
    const receiver = new CompletingReceiver(next);

    const result = phase.scan(receiver, FrameSymbol.for("x"));

    expect(Scan.consume() instanceof Frame).toBe(false);
    expect(receiver.completed).toEqual(1);
    expect(next.received).toEqual(["x"]);
    expect(result).toBe(next);
  });
});
