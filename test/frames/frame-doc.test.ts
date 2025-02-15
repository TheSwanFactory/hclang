import { expect } from "chai";
import { describe, it } from "jsr:@std/testing/bdd";

import { FrameDoc } from "../../src/frames.ts";

describe("FrameDoc", () => {
  const source = "\ndoctest\n";
  const frame_doc = new FrameDoc(source);

  it("is exported", () => {
    expect(FrameDoc).to.be.ok;
  });

  it("is created from a string", () => {
    expect(frame_doc).to.be.instanceOf(FrameDoc);
  });

  it('stringifies with "`"', () => {
    expect(frame_doc.toString()).to.equal(`\`${source}\``);
  });
});
