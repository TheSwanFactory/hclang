
import { FrameString } from "../../src/frames/frame-string";
import * as chai from "chai";

const expect = chai.expect;

describe("FrameString", () => {
  const js_string = "Hello, MAML!";
  const frame_string = new FrameString(js_string);

  it("takes a JavaScript string", () => {
    expect(frame_string).to.be.instanceOf(FrameString);
  });

  it("return JavaScript string for 'toStringData'", () => {
    expect(frame_string.toStringData()).to.equal(js_string);
  });

  it("stringifies with smart quotes", () => {
    expect(frame_string.toString()).to.equal(js_string);
  });
});
