import { expect } from "jsr:@std/expect";
import { describe, it } from "jsr:@std/testing/bdd";

import { FrameNote, FrameString } from "../frames.ts";

describe("FrameString", () => {
  const js_string = "Hello, MAML!";
  const key = "key";
  const value = new FrameString("value");
  const frame_string = new FrameString(js_string, { key: value });

  it("is created from a JavaScript string", () => {
    expect(frame_string).toBeInstanceOf(FrameString);
  });

  it("takes a context", () => {
    expect(frame_string.get(key)).toEqual(value);
  });

  it("uses smart quotes as prefix and suffix", () => {
    expect(frame_string.string_prefix()).toEqual("“");
    expect(frame_string.string_suffix()).toEqual("”");
    expect(frame_string.toStringData()).toEqual(`“${js_string}”`);
  });

  it("stringifies with smart quotes", () => {
    expect(value.toString()).toEqual("“value”");
    expect(frame_string.toString()).toEqual(`(“${js_string}”, .key “value”;)`);
  });

  it("concatenates when called with a FrameString", () => {
    const js_string_2 = " Goodbye, world!";
    const frame_string_2 = new FrameString(js_string_2);
    const result = frame_string.call(frame_string_2);
    expect(result.toString()).toContain(`“${js_string}${js_string_2}”`);
  });

  it("stringifies when called with something else", () => {
    const note = FrameNote.key(key, value);
    const result = frame_string.call(note);
    expect(result.toString()).toContain(key);
  });

  it("returns Note parent on failed reduce", () => {
    const note = FrameNote.key(key, value);
    const result = frame_string.reduce(note);
    expect(result).toEqual(value);

    const extras = note.get(FrameNote.NOTE_EXTRAS);
    expect(extras.toString()).toContain("H, e, l, l, o");
  });
});
