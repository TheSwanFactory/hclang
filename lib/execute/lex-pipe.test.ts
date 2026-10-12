import { expect } from "jsr:@std/expect@^0.219.1";
import { beforeEach, describe, it } from "jsr:@std/testing@^1.0.10/bdd";

import { LexPipe } from "./lex-pipe.ts";
import * as frame from "../frames.ts";
import { ParsePipe } from "./parse-pipe.ts";

describe("LexPipe", () => {
  const success = new frame.FrameString("success!");
  let final: frame.FrameArray;
  let out: ParsePipe;
  let pipe: LexPipe;

  beforeEach(() => {
    final = new frame.FrameArray([]);
    out = new ParsePipe(final, frame.FrameArray);
    out.set(frame.Frame.kEND, success);
    pipe = new LexPipe(out);
  });

  it("is exported", () => {
    expect(LexPipe).toBeTruthy();
  });

  it("is constructed from an out parameter", () => {
    expect(pipe).toBeTruthy();
  });

  it("returns itself on finish", () => {
    const result = pipe.finish(frame.Frame.nil);
    expect(result).toEqual(pipe);
  });

  it("changes output on push", () => {
    const out = pipe.get(frame.Frame.kOUT);
    const result = pipe.perform({ push: frame.FrameExpr });
    const out2 = pipe.get(frame.Frame.kOUT);
    expect(out2).not.toEqual(out);
    expect(result).toEqual(pipe);
    expect(pipe.level).toEqual(1);
  });

  it("changes output on bind", () => {
    const out = pipe.get(frame.Frame.kOUT);
    const result = pipe.perform({ bind: frame.FrameBind });
    const out2 = pipe.get(frame.Frame.kOUT);
    expect(out2).not.toEqual(out);
    expect(result).toEqual(pipe);
  });

  for (
    const [source, diagnostic] of [
      ["]", "$!.parse-unmatched-structure"],
      ["[)", "$!.parse-mismatched-structure"],
      ["[1", "$!.parse-unclosed-structure"],
      ["<", "$!.parse-unclosed-structure"],
    ]
  ) {
    it(`surfaces strict structural failure for ${source}`, () => {
      const strictOut = new frame.FrameArray([]);
      const parser = new ParsePipe(strictOut, frame.FrameGroup, {
        strictStructure: true,
      });
      const result = new frame.FrameString(source).scanInto(
        new LexPipe(parser),
      );

      expect(result.isFailedResult()).toBe(true);
      expect(result.toString()).toContain(diagnostic);
      expect(strictOut.length()).toEqual(0);
    });
  }
});
