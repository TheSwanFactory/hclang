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
  FrameSymbol,
  FrameURI,
} from "../frames.ts";
import { Lex } from "./lex.ts";
import { LexPipe } from "./lex-pipe.ts";
import { ParsePipe } from "./parse-pipe.ts";
import { sigilizer } from "./sigilizer.ts";
import { type AtomSyntax, ScanDisposition } from "../scan.ts";

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

    // The parent declaration needs no lexer rule of its own: `^` is already an
    // operator character, so `.^` lexes as an ordinary name and completes on
    // the following character.
    const declaration = lexAtoms(".^ ");
    expect(declaration).toHaveLength(1);
    expect(declaration[0]).toBeInstanceOf(FrameName);
    expect(declaration[0].toString()).toEqual(".^");

    // The retired spelling stays one name so evaluation can refuse it.
    const retired = lexAtoms("._^ ");
    expect(retired).toHaveLength(1);
    expect(retired[0]).toBeInstanceOf(FrameName);
    expect(retired[0].toString()).toEqual("._^");
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

  it("resets recognition between values sharing one lexer", () => {
    // The `\` lexer transitions to a payload receiver, completes, and must be
    // ready to recognize the next length with no placeholder value in between.
    expect(lexAtoms("\\1\\a\\2\\bc ").map(String)).toEqual([
      "\\1\\a",
      "\\2\\bc",
    ]);
    expect(lexAtoms("“a”“b” ").map(String)).toEqual(["“a”", "“b”"]);
  });

  it("reports an unterminated byte length at physical end of input", () => {
    const output = new FrameArray([]);
    const parser = new ParsePipe(output, FrameGroup);
    const pending = new FrameString("\\12").reduce(new LexPipe(parser), false);
    const result = sigilizer.finish(pending, FrameSymbol.end());

    expect(result.is.error).toEqual(true);
    expect(result.toString()).toEqual("unterminated byte length: \\12");
  });

  it("reports a factoryless completion that omits its value", () => {
    const malformed: AtomSyntax = {
      NAME: "Malformed",
      SIGIL_STARTS: [{ key: "x", mode: "atom" }],
      recognize: () => ({ disposition: ScanDisposition.CompleteConsume }),
      finish: () => ({ disposition: ScanDisposition.CompleteConsume }),
    };

    const result = new Lex(malformed).completeScan();

    expect(result.is.error).toEqual(true);
    expect(result.is.lexical).toEqual(true);
    expect(result.toString()).toEqual(
      "Malformed completed without a value or source factory",
    );
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
