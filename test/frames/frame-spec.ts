
import { Frame, FrameArray } from "../../src/frames/frame";
import * as chai from "chai";

const expect = chai.expect;

describe("Frame", () => {
  const frame = new Frame();

  it("is constructed from nothing", () => {
    expect(frame).to.be.instanceOf(Frame);
  });

  it("returns argument when called", () => {
    const frame2 = new Frame();
    const result = frame.call(frame2);
    expect(result).to.equal(frame2);
  });

  it("stringifies to nil", () => {
    expect(frame.toString()).to.equal("()");
  });

  it("has a unique nil for a properly", () => {
    const nil = Frame.nil;
    expect(nil).to.be.instanceOf(Frame);
    expect(Frame.nil).to.equal(nil);
  });

  it("is in-dependent of context (literal)", () => {
    expect(frame.in()).to.equal(frame);
  });

  it("gets values from context with string key", () => {
    const key = "a";
    const context = new Frame({key: frame});
    const value = context.get(key)
    expect(value).to.equal(frame);
  });
});

describe("FrameArray", () => {
  const frame = new Frame();
  const frame_array = new FrameArray([frame]);

  it("is constructed from an array of frames", () => {
    expect(frame_array).to.be.instanceOf(FrameArray);
  });

  it("uses 'at' to access elements by index", () => {
    const first_element = frame_array.at(0);
    expect(first_element).to.be.ok;
    expect(first_element).to.be.instanceOf(Frame);
  });
});
