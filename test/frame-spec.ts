
import { Frame } from "../src/frame";
import * as chai from "chai";

const expect = chai.expect;

describe("frame", () => {
  it("should greet with message", () => {
    const frame = new Frame("friend");
    expect(frame.greet()).to.equal("Bonjour, friend!");
  });
});
