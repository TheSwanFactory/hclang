import { expect } from "jsr:@std/expect@^0.219.1";
import { describe, it } from "jsr:@std/testing@^1.0.10/bdd";

import {
  FrameDoc,
  FrameString,
  FrameText,
  hasCharacterContent,
} from "../frames.ts";

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

describe("FrameDoc as foreign content", () => {
  const body = "one ` and two `` backticks";
  const document = new FrameDoc(body, undefined, 3);

  it("is a text value, not a string", () => {
    expect(document instanceof FrameText).toEqual(true);
    expect(document).not.toBeInstanceOf(FrameString);
  });

  it("evaluates to itself", () => {
    expect(document.in([new FrameString("context")])).toBe(document);
  });

  it("publishes its body without fences", () => {
    const published = document.get(FrameDoc.BODY_KEY);

    expect(published).toBeInstanceOf(FrameString);
    expect(published.toString()).toEqual(`“${body}”`);
  });

  it("keeps rendering its fences after the body is read", () => {
    const fenced = new FrameDoc("prose", undefined, 3);
    fenced.get(FrameDoc.BODY_KEY);

    expect(fenced.toString()).toEqual("```prose```");
  });

  it("reports an unrelated property as missing", () => {
    expect(document.get("scheme").is.missing).toEqual(true);
  });

  it("contributes its characters when joined to a string", () => {
    expect(hasCharacterContent(document)).toEqual(true);
    expect(document.characterContent()).toEqual(body);
  });
});
