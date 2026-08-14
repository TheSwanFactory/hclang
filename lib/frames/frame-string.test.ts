import { expect } from "jsr:@std/expect@^0.219.1";
import { describe, it } from "jsr:@std/testing@^1.0.10/bdd";

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

  it("nests balanced interior quotes without escapes", () => {
    expect(frame_string.nestingDepth("a “b")).toEqual(1);
    expect(frame_string.nestingDepth("a “b” c")).toEqual(0);
    expect(frame_string.nestingDepth("a “b “c”")).toEqual(1);
  });

  it("round-trips balanced interior quotes", () => {
    const nested = new FrameString("a “b” c");

    expect(nested.toString()).toEqual("“a “b” c”");
  });

  it("registers the ASCII quote as a run-delimited alias", () => {
    const keys = FrameString.SIGIL_STARTS.map(({ key }) => key);

    expect(keys).toEqual(["“", '"']);
    expect(FrameString.RUN_DELIMITER).toEqual('"');
    expect(FrameString.SIGIL_STARTS[1].mode).toEqual("run");
  });

  it("builds a canonical string from an ASCII-quoted run", () => {
    const aliased = FrameString.fromRun('interior " run', 3);

    expect(aliased).toBeInstanceOf(FrameString);
    expect(aliased.toString()).toEqual('“interior " run”');
  });

  it("returns Note parent on failed reduce", () => {
    const note = FrameNote.key(key, value);
    const result = frame_string.reduce(note);
    expect(result).toEqual(value);

    const extras = note.get(FrameNote.NOTE_EXTRAS);
    expect(extras.toString()).toContain("H, e, l, l, o");
  });
});
