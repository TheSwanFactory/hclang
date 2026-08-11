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

  it("preserves a long delimiter", () => {
    const body = "one ` and two `` backticks";
    const long = new FrameDoc(body, undefined, 3);

    expect(long.delimiterLevel).toEqual(3);
    expect(long.toString()).toEqual(`\`\`\`${body}\`\`\``);
  });
});
