import { expect } from "jsr:@std/expect@^0.219.1";
import { beforeEach, describe, it } from "jsr:@std/testing@^1.0.10/bdd";

import { Token } from "./lex.ts";
import { LexPipe } from "./lex-pipe.ts";
import { ParsePipe } from "./parse-pipe.ts";
import * as frame from "../frames.ts";
import { evaluate } from "./evaluate.ts";

describe("Parse", () => {
  const content = new frame.FrameString("content");
  const token = new Token(content);

  let out: frame.FrameArray;
  let pipe: ParsePipe;
  beforeEach(() => {
    out = new frame.FrameArray([]);
    pipe = new ParsePipe(out, frame.FrameGroup);
  });

  describe("Token", () => {
    it("is exported", () => {
      expect(Token).toBeTruthy();
    });

    it("is constructed from a Frame", () => {
      expect(token).toBeTruthy();
    });

    it("calls callee with content when called", () => {
      out.call(token);
      expect(out.asArray().length).toEqual(1);
      expect(out.at(0)).toEqual(content);
    });
  });

  describe("ParsePipe", () => {
    it("is exported", () => {
      expect(ParsePipe).toBeTruthy();
    });

    it("is constructed from an out parameter", () => {
      expect(pipe).toBeTruthy();
    });

    it("emits empty Group on end", () => {
      pipe.call(frame.FrameSymbol.end());
      expect(out.size()).toEqual(1);
      const result = out.at(0);
      expect(result).toBeInstanceOf(frame.FrameGroup);
    });

    it("adds token contents on `call`", () => {
      expect(pipe.length()).toEqual(0);
      pipe.call(token);
      expect(pipe.length()).toEqual(1);
      pipe.call(token);
      expect(pipe.length()).toEqual(2);
    });

    it("collects contents on `next`", () => {
      pipe.call(token);
      expect(pipe.length()).toEqual(1);
      pipe.next(false);
      expect(pipe.length()).toEqual(0);
      const collector = pipe.collector;
      expect(collector.length).toEqual(1);
    });

    it("emits Grouped group on `finish`", () => {
      pipe.call(token);
      pipe.call(frame.FrameSymbol.end());
      expect(out.size()).toEqual(1);
      const group = out.at(0);
      expect(group).toBeInstanceOf(frame.FrameGroup);
      expect(group.toString()).toEqual(`((${content}))`);
    });

    it("joins strings in Grouped", () => {
      pipe.call(token);
      pipe.call(token);
      pipe.call(frame.FrameSymbol.end());
      expect(out.size()).toEqual(1);
      const group = out.at(0);
      expect(group).toBeInstanceOf(frame.FrameGroup);
      expect(group.toString()).toEqual(`((${content} ${content}))`);
    });

    it("commas Grouped strings on `next(false)`", () => {
      pipe.call(token);
      pipe.next(false);
      pipe.call(token);
      pipe.call(frame.FrameSymbol.end());
      expect(out.size()).toEqual(1);
      const group = out.at(0);
      expect(group).toBeInstanceOf(frame.FrameGroup);
      expect(group.toString()).toEqual(`((${content}), (${content}))`);
    });

    it("semicolons Grouped strings on `next(true)`", () => {
      pipe.call(token);
      pipe.next(true);
      pipe.call(token);
      pipe.call(frame.FrameSymbol.end());
      expect(out.size()).toEqual(1);
      const group = out.at(0);
      expect(group).toBeInstanceOf(frame.FrameGroup);
      expect(group.toString()).toEqual(`((${content}); (${content}))`);
    });

    it("parses local, named, and grouped resource imports", () => {
      const parse = (source: string): frame.FrameImport => {
        const output = new frame.FrameArray([]);
        const parser = new ParsePipe(output, frame.FrameGroup, {
          importSource: () => frame.Frame.nil,
        });
        new frame.FrameString(source).scanInto(new LexPipe(parser));
        const group = output.at(0) as frame.FrameGroup;
        const expr = group.asArray()[0] as frame.FrameExpr;
        return expr.asArray()[0] as frame.FrameImport;
      };

      const local = parse(". <- './a.hc'");
      const named = [
        "module<-'./a.hc'",
        "module<- './a.hc'",
        "module <-'./a.hc'",
        "module <- './a.hc'",
      ].map(parse);
      const grouped = parse("module <- ('./a.hc')");

      expect(local).toBeInstanceOf(frame.FrameImport);
      expect(local.target).toEqual({ kind: "local" });
      for (const imported of named) {
        expect(imported).toBeInstanceOf(frame.FrameImport);
        expect(imported.target).toEqual({ kind: "named", key: "module" });
        expect(imported.resourceExpression.toString()).toEqual("'./a.hc'");
      }
      expect(grouped.resourceExpression).toBeInstanceOf(frame.FrameGroup);
    });

    for (
      const source of [
        "<- './a.hc'",
        "<-'./a.hc'",
        ".invalid <- './a.hc'",
        "_ <- './a.hc'",
        "__ <- './a.hc'",
        "_^ <- './a.hc'",
        "_^^ <- './a.hc'",
        "module <-",
        "module<-",
        "module<--'./a.hc'",
        "module <- './a.hc' extra",
      ]
    ) {
      it(`reserves malformed import shape ${source}`, () => {
        const output = new frame.FrameArray([]);
        const parser = new ParsePipe(output, frame.FrameGroup, {
          importSource: () => frame.Frame.nil,
        });
        new frame.FrameString(source).scanInto(new LexPipe(parser));

        expect(output.at(0).toString()).toContain(
          "$!.resource-import-syntax",
        );
        expect(output.at(0).toString()).not.toContain("$!.name-missing");
      });
    }

    it("emits top-level semicolon forms immediately without a trailing empty", () => {
      const output = new frame.FrameArray([]);
      const parser = new ParsePipe(output, frame.FrameGroup, {
        emitCompletedForms: true,
      });
      const lexer = new LexPipe(parser);
      let receiver = new frame.FrameString("1;").scanInto(lexer, false);

      expect(output.length()).toEqual(1);
      receiver = new frame.FrameString("2;").scanInto(receiver, false);
      expect(output.length()).toEqual(2);
      new frame.FrameString("").scanInto(receiver);
      expect(output.length()).toEqual(2);
    });
  });

  describe("document lexer handoff", () => {
    const lexAtoms = (source: string): frame.Frame[] => {
      const output = new frame.FrameArray([]);
      const parser = new ParsePipe(output, frame.FrameGroup);
      const lexer = new LexPipe(parser);

      new frame.FrameString(source).scanInto(lexer);

      const group = output.at(0) as frame.FrameGroup;
      const expr = group.asArray()[0] as frame.FrameExpr;
      return expr.asArray();
    };

    it("receives one document for a non-empty odd-fenced source", () => {
      const atoms = lexAtoms("`````body`````");

      expect(atoms.length).toEqual(1);
      expect(atoms[0]).toBeInstanceOf(frame.FrameDoc);
      expect(atoms[0].toString()).toEqual("`````body`````");
    });

    it("receives one document for one maximal even run", () => {
      const atoms = lexAtoms("``````");

      expect(atoms.length).toEqual(1);
      expect(atoms[0]).toBeInstanceOf(frame.FrameDoc);
      expect(atoms[0].toString()).toEqual("``````");
    });

    it("receives the character following an even run as the next atom", () => {
      const atoms = lexAtoms("``7");

      expect(atoms.length).toEqual(2);
      expect(atoms[0]).toBeInstanceOf(frame.FrameDoc);
      expect(atoms[1]).toBeInstanceOf(frame.FrameInt);
      expect(atoms[1].toString()).toEqual("7");
    });

    it("receives the character following a closing run as the next atom", () => {
      const atoms = lexAtoms("```body```7");

      expect(atoms.length).toEqual(2);
      expect(atoms[0]).toBeInstanceOf(frame.FrameDoc);
      expect(atoms[0].toString()).toEqual("```body```");
      expect(atoms[1]).toBeInstanceOf(frame.FrameInt);
      expect(atoms[1].toString()).toEqual("7");
    });
  });

  describe("the Concrete Semantics Graph (spec a16)", () => {
    const body = (source: string): frame.Frame[] =>
      (evaluate(source).at(0) as frame.FrameLazy).asArray();

    it("emits no FrameBind and no one-term wrapper", () => {
      const [expr] = body("{4 + 5}");
      expect(expr).toBeInstanceOf(frame.FrameExpr);
      const terms = (expr as frame.FrameExpr).asArray();
      expect(terms.length).toEqual(3);
      expect(terms.some((term) => term instanceof frame.FrameBind)).toBe(false);
      expect(terms.some((term) => term instanceof frame.FrameExpr)).toBe(false);
    });

    it("keeps abutting terms as one tight expression", () => {
      const [expr] = body("{f o.x}");
      const terms = (expr as frame.FrameExpr).asArray();
      expect(terms.length).toEqual(2);
      expect(terms[1]).toBeInstanceOf(frame.FrameExpr);
      expect(terms[1]).not.toBeInstanceOf(frame.FrameBind);
      expect((terms[1] as frame.FrameExpr).asArray().length).toEqual(2);
    });
  });
});
