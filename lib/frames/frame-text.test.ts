import { expect } from "jsr:@std/expect@^0.219.1";
import { describe, it } from "jsr:@std/testing@^1.0.10/bdd";

import {
  FrameBytes,
  FrameComment,
  FrameDoc,
  FrameNumber,
  FrameString,
  FrameText,
  FrameURI,
  hasCharacterContent,
} from "../frames.ts";

describe("FrameText", () => {
  it("holds the body of every delimited text family", () => {
    for (
      const value of [
        new FrameString("a"),
        new FrameDoc("a"),
        new FrameComment("a"),
        new FrameURI("hc/doc"),
      ]
    ) {
      expect(value instanceof FrameText).toEqual(true);
    }
  });

  it("excludes byte strings, whose body is derived from bytes", () => {
    expect(new FrameBytes([0x61]) instanceof FrameText).toEqual(false);
  });

  describe("character content", () => {
    it("is advertised by strings and documents", () => {
      expect(hasCharacterContent(new FrameString("a"))).toEqual(true);
      expect(hasCharacterContent(new FrameDoc("a"))).toEqual(true);
    });

    it("is withheld by values that merely contain text", () => {
      expect(hasCharacterContent(new FrameComment("a"))).toEqual(false);
      expect(hasCharacterContent(new FrameURI("hc/doc"))).toEqual(false);
      expect(hasCharacterContent(new FrameBytes([0x61]))).toEqual(false);
    });
  });

  describe("juxtaposition", () => {
    const receiver = new FrameString("a");

    it("takes the raw body of a string", () => {
      expect(receiver.apply(new FrameString("b")).toString()).toEqual("“ab”");
    });

    it("takes the raw body of a document, without its fences", () => {
      expect(receiver.apply(new FrameDoc("b", undefined, 3)).toString())
        .toEqual("“ab”");
    });

    it("keeps the delimiters of a comment", () => {
      expect(receiver.apply(new FrameComment("b")).toString()).toEqual(
        "“a#b#”",
      );
    });

    it("keeps the delimiters of a resource identifier", () => {
      expect(receiver.apply(new FrameURI("hc/doc")).toString()).toEqual(
        "“a'hc/doc'”",
      );
    });

    it("takes the spelling of any other atom", () => {
      expect(receiver.apply(new FrameNumber("7")).toString()).toEqual("“a7”");
    });

    it("yields a string when a document is the receiver", () => {
      const joined = new FrameDoc("a", undefined, 3).apply(
        new FrameString("b"),
      );

      expect(joined).toBeInstanceOf(FrameString);
      expect(joined.toString()).toEqual("“ab”");
    });
  });
});
