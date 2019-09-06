
import { expect } from "chai";
import {} from "mocha";
import { FrameBlob } from "../../src/frames";

describe("FrameBlob", () => {
  const source = "0b10101";
  const frame_blob = new FrameBlob(source, 2);

  it("is exported", () => {
    expect(FrameBlob).to.be.ok;
  });

  it("is created from a string", () => {
    expect(frame_blob).to.be.instanceOf(FrameBlob);
  });

  it("stringifies back to that string", () => {
    expect(frame_blob.toString()).to.equal(source);
  });
});
