
import { expect } from "chai";
import {} from "mocha";
import { FrameBytes } from "../../src/frames";

describe("FrameBytes", () => {
  const js_string = "Hello world";
  const hello_world = [0x48, 0x65, 0x6C, 0x6C, 0x6F, 0x20, 0x57, 0x6F, 0x72, 0x6C, 0x64, 0x21];
  const bytes = new FrameBytes(hello_world);

  it("is created from a number array", () => {
    expect(bytes).to.be.instanceOf(FrameBytes);
  });

  it("stringifies as a buffer", () => {
    expect(bytes.toString()).to.equal(`(“${js_string}”, .key “value”;)`);
  });

});
