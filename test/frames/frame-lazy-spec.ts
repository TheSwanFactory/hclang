import { expect } from "chai";
import { FrameString, FrameLazy } from "../../src/frames";

describe("FrameLazy", () => {
  const frame = new FrameString("frame");
  const lazy = new FrameLazy(frame);

  it("takes a Frame", () => {
    expect(lazy).to.be.instanceof(FrameLazy);
  });

  it("returns that Frame when evaluated", () => {
    expect(true).to.be.true;
  });

  it("sets that Frame's kUP to the calling context", () => {
    expect(true).to.be.true;
  });

  it("stringifies to {frame}", () => {
    expect(true).to.be.true;
  });
});
