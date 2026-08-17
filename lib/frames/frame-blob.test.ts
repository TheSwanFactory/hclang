import { expect } from "jsr:@std/expect@^0.219.1";
import { describe, it } from "jsr:@std/testing@^1.0.10/bdd";

import {
  Frame,
  FrameBlob,
  FrameSymbol,
  ScanDisposition,
  type ScanResult,
} from "../frames.ts";

/** Recognition is class-side, so no value is needed to exercise it. */
const scan = (char: string, source: string): ScanResult =>
  FrameBlob.SYNTAX.recognize(FrameSymbol.for(char), source, Frame.nil);

describe("FrameBlob", () => {
  const source = "0b10100101";
  const frame_blob = new FrameBlob(source);

  it("is exported", () => {
    expect(FrameBlob).toBeTruthy();
  });

  it("finds base from string", () => {
    const x = FrameBlob.find_base("0x00abc");
    expect(x).toEqual(16);
    const b = FrameBlob.find_base("0b01");
    expect(b).toEqual(2);
  });

  it("is created from a string", () => {
    expect(frame_blob).toBeInstanceOf(FrameBlob);
  });

  it("stringifies back to that string", () => {
    expect(frame_blob.toString()).toEqual(source);
  });

  it("defaults to hexadecimal", () => {
    const empty_blob = new FrameBlob("");
    expect(empty_blob.toString()).toEqual("0x0");
    expect(empty_blob.canInclude("F")).toBe(true);
  });

  it("can include anything in base64", () => {
    expect(frame_blob.canInclude("F")).toBe(true);
  });

  it("scans digits according to the selected base", () => {
    const cases = [
      ["b10", "1", "2"],
      ["o7", "7", "8"],
      ["xF", "a", "G"],
      ["tz", "z", "i"],
      ["sA", "/", "_"],
    ];

    cases.forEach(([source, valid, invalid]) => {
      const accepted = scan(valid, source);
      const rejected = scan(invalid, source);

      expect(accepted.disposition).toEqual(ScanDisposition.Consume);
      expect(rejected.disposition).toEqual(
        ScanDisposition.CompleteRedispatch,
      );
    });
  });

  it("remembers leading zeros", () => {
    const fourZeros = "0b00001";
    const padded = new FrameBlob(fourZeros);
    expect(padded.toString()).toEqual(fourZeros);
  });

  it("reports and slices its exact bit width without mutation", () => {
    const blob = new FrameBlob("0b00101");
    expect(blob.bitLength()).toEqual(5);
    expect(blob.sliceBits(0, 3).toString()).toEqual("0b001");
    expect(blob.sliceBits(3, 2).toString()).toEqual("0b01");
    expect(blob.toString()).toEqual("0b00101");
  });

  it("handles all zeros correctly", () => {
    const fourZeros = "0b0000";
    const padded = new FrameBlob(fourZeros);
    expect(padded.toString()).toEqual(fourZeros);
  });

  it("appends blobs on a common base", () => {
    const fifteen = "0xf";
    const left = new FrameBlob(fifteen);
    const result = left.call(frame_blob);
    expect(result.toString()).toEqual("0xfa5");
  });

  it("append tracks length properly", () => {
    const fifteen = "0xf";
    const one_l2 = "0b01";
    const right = new FrameBlob(fifteen);
    const left = new FrameBlob(one_l2);

    right.call(frame_blob);
    left.call(right);
    expect(left.toString()).toEqual("0b01111110100101");
  });
});
