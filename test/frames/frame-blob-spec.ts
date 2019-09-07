
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
  });

  it("is created from a string", () => {
    expect(frame_blob).to.be.instanceOf(FrameBlob);
  });

  it("stringifies back to that string", () => {
    expect(frame_blob.toString()).to.equal(source);
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
