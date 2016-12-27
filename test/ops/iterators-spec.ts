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

    it("calls block with each element", () => {
      const result_string = result.toString();
      expect(result_string).to.include("Prefix: An Author");
      expect(result_string).to.include("Prefix: A Title");
    });

    it("calls keys in order they were created", () => {
      const first = result.at(0).toString();
      const second = result.at(1).toString();

      expect(first).to.equal("“Prefix: An Author”");
      expect(second).to.equal("“Prefix: A Title”");
    });
  });
});
