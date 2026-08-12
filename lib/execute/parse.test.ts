import { expect } from "jsr:@std/expect@^0.219.1";
import { beforeEach, describe, it } from "jsr:@std/testing@^1.0.10/bdd";

import { Token } from "./lex.ts";
import { LexPipe } from "./lex-pipe.ts";
import { ParsePipe } from "./parse-pipe.ts";
import * as frame from "../frames.ts";

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
  });

  describe("document lexer handoff", () => {
    const lexAtoms = (source: string): frame.Frame[] => {
      const output = new frame.FrameArray([]);
      const parser = new ParsePipe(output, frame.FrameGroup);
      const lexer = new LexPipe(parser);

      new frame.FrameString(source).reduce(lexer);

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
      expect(atoms[1]).toBeInstanceOf(frame.FrameNumber);
      expect(atoms[1].toString()).toEqual("7");
    });

    it("receives the character following a closing run as the next atom", () => {
      const atoms = lexAtoms("```body```7");

      expect(atoms.length).toEqual(2);
      expect(atoms[0]).toBeInstanceOf(frame.FrameDoc);
      expect(atoms[0].toString()).toEqual("```body```");
      expect(atoms[1]).toBeInstanceOf(frame.FrameNumber);
      expect(atoms[1].toString()).toEqual("7");
    });
  });
});
