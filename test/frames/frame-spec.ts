
import { Frame } from "../../src/frames/frame";
import * as chai from "chai";

const expect = chai.expect;

describe("frame", () => {
  it("should exist", () => {
    const frame = new Frame();
    expect(frame).to.be.instanceOf(Frame);
  });
});
