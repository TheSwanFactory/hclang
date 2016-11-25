
import { IKeyValuePair, Frame, FrameArray } from "../../src/frames/frame";
import * as chai from "chai";

const expect = chai.expect;

describe("Frame", () => {
  const frame = new Frame({nil: Frame.nil});

  it("has a unique nil for a properly", () => {
    const nil = Frame.nil;
    expect(nil).to.be.instanceOf(Frame);
    expect(Frame.nil).to.equal(nil);
  });

  it("is constructed from a dictionary", () => {
    expect(frame).to.be.instanceOf(Frame);
  });

  it("returns argument when called", () => {
    const frame2 = new Frame();
    const result = frame.call(frame2);
    expect(result).to.equal(frame2);
  });

  it("stringifies to context", () => {
    expect(Frame.nil.toString()).to.equal("()");
    expect(frame.toString()).to.equal("(.nil ();)");
  });

  it("is in-dependent of context (literal)", () => {
    expect(frame.in()).to.equal(frame);
  });

  it("returns list of meta_keys", () => {
    const keys = frame.meta_keys();
    expect(keys).to.eql(["nil"]);
  });

  it("returns list of meta_pairs of type [IKeyValuePair]", () => {
    const pairs: IKeyValuePair[] = frame.meta_pairs();
    expect(pairs).to.eql([["nil", Frame.nil]]);
  });



  it("gets values from context with string key", () => {
    const value = frame.get("nil");
    expect(value).to.equal(Frame.nil);
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
