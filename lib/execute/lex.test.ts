import { expect } from "jsr:@std/expect@^0.219.1";
import { describe, it } from "jsr:@std/testing@^1.0.10/bdd";

import {
  Frame,
  FrameArray,
  FrameExpr,
  FrameGroup,
  FrameName,
  FrameString,
} from "../frames.ts";
import { LexPipe } from "./lex-pipe.ts";
import { ParsePipe } from "./parse-pipe.ts";

const lexAtoms = (source: string): Frame[] => {
  const output = new FrameArray([]);
  const parser = new ParsePipe(output, FrameGroup);
  const lexer = new LexPipe(parser);

  new FrameString(source).reduce(lexer);

  const group = output.at(0) as FrameGroup;
  const expr = group.asArray()[0] as FrameExpr;
  return expr.asArray();
};

const lexChunkedAtoms = (chunks: string[]): Frame[] => {
  const output = new FrameArray([]);
  const parser = new ParsePipe(output, FrameGroup);
  const lexer = new LexPipe(parser);
  let receiver: Frame = lexer;

  chunks.forEach((chunk) => {
    receiver = new FrameString(chunk).reduce(receiver, false);
  });
  new FrameString("").reduce(receiver);

  const group = output.at(0) as FrameGroup;
  const expr = group.asArray()[0] as FrameExpr;
  return expr.asArray();
};

describe("Lex", () => {
  it("preserves name and operator boundaries", () => {
    expect(lexAtoms(".a-b ").map(String)).toEqual([".a-b"]);
    expect(lexAtoms(".a+b ").map(String)).toEqual([".a", "+", "b"]);
    expect(lexAtoms(".+ ").map(String)).toEqual([".+"]);
    expect(lexAtoms(".plain, ").map(String)).toEqual([".plain"]);
  });

  for (const name of [".<", ".>", ".<=", ".>="]) {
    it(`lexes ${name} as one selected dotted name`, () => {
      const atoms = lexAtoms(`${name} `);

      expect(atoms).toHaveLength(1);
      expect(atoms[0]).toBeInstanceOf(FrameName);
      expect(atoms[0].toString()).toEqual(name);
    });

    it(`lexes ${name} identically across every two-chunk split`, () => {
      for (let split = 1; split < name.length; split++) {
        expect(
          lexChunkedAtoms([name.slice(0, split), name.slice(split)]).map(
            String,
          ),
        ).toEqual([name]);
      }
    });
  }

  it("keeps raw angle brackets structural", () => {
    const atoms = lexAtoms("<> ");

    expect(atoms).toHaveLength(1);
    expect(atoms[0]).toBe(Frame.all);
  });

  it("preserves phone-shaped property decomposition", () => {
    expect(lexAtoms("+1.408.555.1212 ").map(String)).toEqual([
      "+",
      "1",
      ".408",
      ".555",
      ".1212",
    ]);
  });

  it("accepts arbitrary non-structural operator runs", () => {
    expect(lexAtoms("+? ").map(String)).toEqual(["+?"]);
  });

  it("ends lower-base blobs before an invalid digit", () => {
    expect(lexAtoms("0b102 ").map(String)).toEqual(["0b10", "2"]);
  });

  it("emits a byte payload before scanning the following symbol", () => {
    expect(lexAtoms("\\1\\a7 ").map(String)).toEqual(["\\1\\a", "7"]);
  });
});
