import { expect } from "npm:chai";
import { describe, it } from "jsr:@std/testing/bdd";

import { FrameBytes } from "../../src/frames.ts";

describe("FrameBytes", () => {
  const js_string = "Hello World!";
  const hello_world = [
    0x48,
    0x65,
    0x6C,
    0x6C,
    0x6F,
    0x20,
    0x57,
    0x6F,
    0x72,
    0x6C,
    0x64,
    0x21,
  ];
  const bytes = new FrameBytes(hello_world);

  it("is created from a number array", () => {
    expect(bytes).to.be.instanceOf(FrameBytes);
  });

  it("stringifies as a bytestring", () => {
    const n = js_string.length;
    expect(bytes.toString()).to.equal(`\\${n}\\${js_string}`);
  });
});
