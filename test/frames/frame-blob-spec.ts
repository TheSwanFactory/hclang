
import { expect } from "chai";
import {} from "mocha";
import { FrameBlob } from "../../src/frames";

describe("FrameBlob", () => {
  const source = "0b10100101";
  const frame_blob = new FrameBlob(source, 2);

  it("is exported", () => {
    expect(FrameBlob).to.be.ok;
  });

  it("captures leading zeros", () => {
    const two = FrameBlob.leading_zeros("0x00abc");
    expect(two).to.equal("00");
    const none = FrameBlob.leading_zeros("0xabc");
    expect(none).to.equal("");
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

  it("defaults to base64", () => {
    const empty_blob = new FrameBlob(source, 2);
    expect(empty_blob.toString()).to.equal(source);
  });

  it("remembers leading zeros", () => {
    const l5 = "0b00001";
    const padded = new FrameBlob(l5, 2);
    expect(padded.toString()).to.equal(l5);
  });

  it("appends blobs on a common base", () => {
    const fifteen = "0xf";
    const left = new FrameBlob(fifteen, 16);
    const result = left.call(frame_blob);
    expect(result.toString()).to.equal("0xfa5");
  });

  it("append tracks length properly", () => {
    const fifteen = "0xf";
    const one_l2 = "0b01";
    const right = new FrameBlob(fifteen, 16);
    const left = new FrameBlob(one_l2, 2);

    right.call(frame_blob);
    left.call(right);
    expect(left.toString()).to.equal("0b01111110100101");
  });

});
