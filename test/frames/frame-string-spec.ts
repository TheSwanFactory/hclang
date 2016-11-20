
import { FrameString } from "../../src/frames/frame-string";
import * as chai from "chai";

const expect = chai.expect;

describe("FrameString", () => {
  it("takes a JavaScript string", () => {
    const frame_string = new FrameString("a");
    expect(frame_string).to.be.instanceOf(FrameString);
  });
  it("stringifies with smart quotes", () => {
    const frame_string = new FrameString("a");
    expect(frame_string.toString()).to.equal("\\\\a");
  });
});
