import { expect } from "chai";
import { describe, it } from "mocha";

import { FrameBlob } from "../../src/frames.ts";

describe("FrameBlob", () => {
  const source = "0b10100101";
  const frame_blob = new FrameBlob(source);

  it("is exported", () => {
    expect(FrameBlob).to.be.ok;
  });

  it("finds base from string", () => {
    const x = FrameBlob.find_base("0x00abc");
    expect(x).to.equal(16);
    const b = FrameBlob.find_base("0b01");
    expect(b).to.equal(2);
  });

  it("is created from a string", () => {
    expect(frame_blob).to.be.instanceOf(FrameBlob);
  });

  it("stringifies back to that string", () => {
    expect(frame_blob.toString()).to.equal(source);
  });

  it("defaults to hexadecimal", () => {
    const empty_blob = new FrameBlob("");
    expect(empty_blob.toString()).to.equal("0x0");
    expect(empty_blob.canInclude("F")).to.be.true;
  });

  it("can include anything in base64", () => {
    expect(frame_blob.canInclude("F")).to.be.true;
  });

  it("remembers leading zeros", () => {
    const fourZeros = "0b00001";
    const padded = new FrameBlob(fourZeros);
    expect(padded.toString()).to.equal(fourZeros);
  });

  it("handles all zeros correctly", () => {
    const fourZeros = "0b0000";
    const padded = new FrameBlob(fourZeros);
    expect(padded.toString()).to.equal(fourZeros);
  });

  it("appends blobs on a common base", () => {
    const fifteen = "0xf";
    const left = new FrameBlob(fifteen);
    const result = left.call(frame_blob);
    expect(result.toString()).to.equal("0xfa5");
  });

  it("append tracks length properly", () => {
    const fifteen = "0xf";
    const one_l2 = "0b01";
    const right = new FrameBlob(fifteen);
    const left = new FrameBlob(one_l2);

    right.call(frame_blob);
    left.call(right);
    expect(left.toString()).to.equal("0b01111110100101");
  });
});
