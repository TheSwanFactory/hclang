import { Frame } from "../../src/frames/frame";
import { FrameString } from "../../src/frames/frame-string";
import * as chai from "chai";
const expect = chai.expect;

describe("FrameString", () => {
  const js_string = "Hello, MAML!";
  const key = "key";
  const value = new Frame({value: Frame.nil});
  const frame_string = new FrameString(js_string, {key: value});

  it("takes a JavaScript string", () => {
    expect(frame_string).to.be.instanceOf(FrameString);
  });

  it("takes a context", () => {
    expect(frame_string.get(key)).to.equal(value);
  });

  it("return JavaScript string for 'toStringData'", () => {
    expect(frame_string.toStringData()).to.equal(js_string);
  });

  it("stringifies with smart quotes", () => {
    expect(frame_string.toString()).to.equal(`“${js_string}”`);
  });

  it("appends when called with a FrameString", () => {
    const js_string_2 = " Goodbye, world!";
    const frame_string_2 = new FrameString(js_string_2);
    const result = frame_string.call(frame_string_2)
    expect(result.toString()).to.equal(`“${js_string}${js_string_2}”`);
  });
});
