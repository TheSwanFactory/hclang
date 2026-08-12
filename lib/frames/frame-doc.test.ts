import { expect } from "jsr:@std/expect@^0.219.1";
import { describe, it } from "jsr:@std/testing@^1.0.10/bdd";

import { FrameDoc } from "../frames.ts";

describe("FrameDoc", () => {
  const source = "\ndoctest\n";
  const frame_doc = new FrameDoc(source);

  it("is exported", () => {
    expect(FrameDoc).toBeTruthy();
  });

  it("is created from a string", () => {
    expect(frame_doc).toBeInstanceOf(FrameDoc);
  });

  it('stringifies with "`"', () => {
    expect(frame_doc.toString()).toEqual(`\`${source}\``);
  });

  for (const fenceLength of [1, 3, 5, 7]) {
    it(`preserves an odd fence of length ${fenceLength}`, () => {
      const fence = "`".repeat(fenceLength);
      const body = "one ` and two `` backticks";
      const document = new FrameDoc(body, undefined, fenceLength);

      expect(document.fenceLength).toEqual(fenceLength);
      expect(document.toString()).toEqual(`${fence}${body}${fence}`);
    });
  }

  for (const fenceLength of [2, 4, 6, 8]) {
    it(`preserves an empty even fence of length ${fenceLength}`, () => {
      const fence = "`".repeat(fenceLength);
      const document = new FrameDoc("", undefined, fenceLength);

      expect(document.fenceLength).toEqual(fenceLength);
      expect(document.string_prefix()).toEqual(fence);
      expect(document.string_suffix()).toEqual("");
      expect(document.toString()).toEqual(fence);
    });
  }
});
