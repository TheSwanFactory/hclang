
import { FrameString } from "../../src/frames/frame-string";
import * as chai from "chai";

const expect = chai.expect;

describe("FrameString", () => {
  const frame_string = new FrameString("Hello, MAML!");

  it("takes a JavaScript string", () => {
    expect(frame_string).to.be.instanceOf(FrameString);
  });

  it.skip("stringifies with smart quotes", () => {
    expect(frame_string.toString()).to.equal("\\\\a");
  });
});
