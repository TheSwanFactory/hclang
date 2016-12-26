import { expect } from "chai";
import { Frame, FrameString } from "../../src/frames";

describe("iterators", () => {
  const frame = new Frame({
    author: new FrameString("An Author"),
    title: new FrameString("A Title"),
  });

  it("acts on a Frame", () => {
    expect(frame).to.be.instanceOf(Frame);
  });
});
