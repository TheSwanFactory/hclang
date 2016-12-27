import { expect } from "chai";
import { Frame, FrameArray, FrameString } from "../../src/frames";
import { MetaMap } from "../../src/ops";

describe("iterators", () => {
  const frame = new Frame({
    author: new FrameString("An Author"),
    title: new FrameString("A Title"),
  });

  const block = new FrameString("Prefix: ");

  it("acts on a Frame block", () => {
    const arg = new FrameString("argument");
    const result = block.call(arg);
    expect(result.toString()).to.equal("“Prefix: argument”");
  });

  describe("MetaMap", () => {
    const result = MetaMap(frame, block);
    it("takes a frame and a block", () => {
      expect(result).to.be.instanceOf(Frame);
    });

    it("returns a FrameArray", () => {
      expect(result).to.be.instanceOf(FrameArray);
    });
  });
});
