import { expect } from "jsr:@std/expect@^0.219.1";
import { describe, it } from "jsr:@std/testing@^1.0.10/bdd";

import {
  FrameArray,
  FrameBytePayload,
  FrameBytes,
  FrameNumber,
  FrameString,
  FrameSymbol,
  ScanDisposition,
} from "../frames.ts";

describe("FrameBytes", () => {
  const js_string = "Hello World!";
  const hello_world = [
    0x48,
    0x65,
    0x6C,
    0x6C,
    0x6F,
    0x20,
    0x57,
    0x6F,
    0x72,
    0x6C,
    0x64,
    0x21,
  ];
  const bytes = new FrameBytes(hello_world);

  it("is created from a number array", () => {
    expect(bytes).toBeInstanceOf(FrameBytes);
  });

  it("stringifies as a bytestring", () => {
    const n = js_string.length;
    expect(bytes.toString()).toEqual(`\\${n}\\${js_string}`);
  });

  it("resolves a symbolic length from the supplied context", () => {
    const context = new FrameArray([]);
    context.set("size", new FrameNumber("3"));

    const result = FrameBytes.SYNTAX.recognize(
      FrameSymbol.for("\\"),
      "size",
      context,
    );

    expect(result.disposition).toEqual(ScanDisposition.Transition);
    expect(result.frame).toBeInstanceOf(FrameBytePayload);
    expect((result.frame as FrameBytePayload).count).toEqual(3);
  });

  it("resolves a symbolic zero length to an empty byte string", () => {
    const context = new FrameArray([]);
    context.set("size", new FrameNumber("0"));

    const result = FrameBytes.SYNTAX.recognize(
      FrameSymbol.for("\\"),
      "size",
      context,
    );

    expect(result.disposition).toEqual(ScanDisposition.CompleteConsume);
    expect(result.frame?.toString()).toEqual("\\0\\");
  });

  it("rejects a missing symbolic length", () => {
    const result = FrameBytes.SYNTAX.recognize(
      FrameSymbol.for("\\"),
      "missing",
      new FrameArray([]),
    );

    expect(result).toEqual({
      disposition: ScanDisposition.Error,
      message: "byte length not found: missing",
    });
  });

  it("rejects a nonnumeric symbolic length", () => {
    const context = new FrameArray([]);
    context.set("size", new FrameString("three"));

    const result = FrameBytes.SYNTAX.recognize(
      FrameSymbol.for("\\"),
      "size",
      context,
    );

    expect(result).toEqual({
      disposition: ScanDisposition.Error,
      message: "invalid byte length value for size: “three”",
    });
  });

  for (const invalid of ["-1", "1.5", "Infinity", "9007199254740992"]) {
    it(`rejects the invalid numeric length ${invalid}`, () => {
      const context = new FrameArray([]);
      context.set("size", new FrameNumber(invalid));

      const result = FrameBytes.SYNTAX.recognize(
        FrameSymbol.for("\\"),
        "size",
        context,
      );

      expect(result).toEqual({
        disposition: ScanDisposition.Error,
        message: `invalid byte length value for size: ${invalid}`,
      });
    });
  }

  it("reports an unterminated symbolic length", () => {
    expect(FrameBytes.SYNTAX.finish("size")).toEqual({
      disposition: ScanDisposition.Error,
      message: "unterminated byte length: \\size",
    });
  });
});
