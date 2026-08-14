import { expect } from "jsr:@std/expect@^0.219.1";
import { describe, it } from "jsr:@std/testing@^1.0.10/bdd";

import {
  Frame,
  FrameArg,
  FrameArray,
  FrameExpr,
  FrameGroup,
  FrameName,
  FrameNumber,
  FrameParam,
  FrameString,
  FrameURI,
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

  it("lexes a trailing-colon mutating name across chunk boundaries", () => {
    for (const name of [".mutator:", "mutator:", "@mutator:"]) {
      expect(lexAtoms(`${name} `).map(String)).toEqual([name]);
      for (let split = 1; split < name.length; split++) {
        expect(
          lexChunkedAtoms([name.slice(0, split), name.slice(split)]).map(
            String,
          ),
        ).toEqual([name]);
      }
    }
  });

  it("ends a mutating identifier after its trailing colon", () => {
    expect(lexAtoms(".mutator:x ").map(String)).toEqual([".mutator:", "x"]);
    expect(lexAtoms(".mutator:: ").map(String)).toEqual([".mutator:", ":"]);
    expect(lexAtoms("mutator:x ").map(String)).toEqual(["mutator:", "x"]);
    expect(lexAtoms("@mutator:x ").map(String)).toEqual(["@mutator:", "x"]);
  });

  it("keeps a standalone colon as an operator", () => {
    expect(lexAtoms(": ").map(String)).toEqual([":"]);
  });

  it("lexes source parent lookup and declaration names", () => {
    for (const name of ["_", "__", "___"]) {
      const local = lexAtoms(`${name} `);
      expect(local).toHaveLength(1);
      expect(local[0]).toBeInstanceOf(FrameArg);
      expect(local[0].toString()).toEqual(name);
    }

    const parent = lexAtoms("_^ ");
    expect(parent).toHaveLength(1);
    expect(parent[0]).toBeInstanceOf(FrameParam);
    expect(parent[0].toString()).toEqual("_^");

    const outerParent = lexAtoms("_^^ ");
    expect(outerParent).toHaveLength(1);
    expect(outerParent[0]).toBeInstanceOf(FrameParam);
    expect(outerParent[0].toString()).toEqual("_^^");

    const declaration = lexAtoms("._^ ");
    expect(declaration).toHaveLength(1);
    expect(declaration[0]).toBeInstanceOf(FrameName);
    expect(declaration[0].toString()).toEqual("._^");
  });

  it("preserves parent identifiers across chunk boundaries", () => {
    for (const name of ["_^", "_^^"]) {
      for (let split = 1; split < name.length; split++) {
        expect(
          lexChunkedAtoms([name.slice(0, split), name.slice(split)]).map(
            String,
          ),
        ).toEqual([name]);
      }
    }
    expect(lexChunkedAtoms(["._", "^"]).map(String)).toEqual(["._^"]);
  });

  it("nests curly quotes without an escape character", () => {
    expect(lexAtoms("“a “b” c” ").map(String)).toEqual(["“a “b” c”"]);
    expect(lexAtoms("“a”“b” ").map(String)).toEqual(["“a”", "“b”"]);
  });

  it("lexes an ASCII-quoted run as one canonical string", () => {
    expect(lexAtoms('"a" ').map(String)).toEqual(["“a”"]);
    expect(lexAtoms('"" ').map(String)).toEqual(["“”"]);
    expect(lexAtoms('"""a"b""" ').map(String)).toEqual(['“a"b”']);
    expect(lexAtoms('"a“b”c" ').map(String)).toEqual(["“a“b”c”"]);
    expect(lexAtoms('“a "b" c” ').map(String)).toEqual(['“a "b" c”']);
  });

  it("lexes ASCII-quoted strings identically across every two-chunk split", () => {
    const source = '"""a"b"""';

    for (let split = 1; split < source.length; split++) {
      expect(
        lexChunkedAtoms([source.slice(0, split), source.slice(split)]).map(
          String,
        ),
      ).toEqual(['“a"b”']);
    }
  });

  it("lexes a resource identifier and its components", () => {
    const atoms = lexAtoms("'jsr:@swanfactory/hclang' ");

    expect(atoms).toHaveLength(1);
    expect(atoms[0]).toBeInstanceOf(FrameURI);
    expect(atoms[0].toString()).toEqual("'jsr:@swanfactory/hclang'");
    expect(atoms[0].get("scheme").toString()).toEqual("“jsr”");
  });

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

  it("supplies live scope while preserving dynamic byte boundaries", () => {
    const output = new FrameArray([]);
    output.set("size", new FrameNumber("1"));
    const parser = new ParsePipe(output, FrameGroup);
    const lexer = new LexPipe(parser);

    new FrameString("\\size\\a7 ").reduce(lexer);

    const group = output.at(0) as FrameGroup;
    const expr = group.asArray()[0] as FrameExpr;
    expect(expr.asArray().map(String)).toEqual(["\\1\\a", "7"]);
  });

  it("redispatches the first payload character after a dynamic zero length", () => {
    const output = new FrameArray([]);
    output.set("size", new FrameNumber("0"));
    const parser = new ParsePipe(output, FrameGroup);
    const lexer = new LexPipe(parser);

    new FrameString("\\size\\7 ").reduce(lexer);

    const group = output.at(0) as FrameGroup;
    const expr = group.asArray()[0] as FrameExpr;
    expect(expr.asArray().map(String)).toEqual(["\\0\\", "7"]);
  });
});
