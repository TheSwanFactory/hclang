import { expect } from "chai";
import { Frame, FrameString } from "../../src/frames";

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
    it("acts on a Frame", () => {
      expect(frame).to.be.instanceOf(Frame);
    });
  });
});
