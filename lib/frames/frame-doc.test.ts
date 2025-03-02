import { expect } from "jsr:@std/expect";
import { describe, it } from "jsr:@std/testing/bdd";

import { FrameDoc } from "../frames.ts";

describe("FrameDoc", () => {
  const source = "\ndoctest\n";
  const frame_doc = new FrameDoc(source);

  it("is exported", () => {
    expect(FrameDoc).to.be.ok;
  });

  it("is created from a string", () => {
    expect(frame_doc).toBeInstanceOf(FrameDoc);
  });

  it('stringifies with "`"', () => {
    expect(frame_doc.toString()).toEqual(`\`${source}\``);
  });
});
