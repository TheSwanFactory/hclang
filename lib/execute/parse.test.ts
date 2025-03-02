import { expect } from "jsr:@std/expect";
import { beforeEach, describe, it } from "jsr:@std/testing/bdd";

import { Token } from "./lex.ts";
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
      expect(Token).to.be.ok;
    });

    it("is constructed from a Frame", () => {
      expect(token).to.be.ok;
    });

    it("calls callee with content when called", () => {
      out.call(token);
      expect(out.asArray().length).toEqual(1);
      expect(out.at(0)).toEqual(content);
    });
  });

  describe("ParsePipe", () => {
    it("is exported", () => {
      expect(ParsePipe).to.be.ok;
    });

    it("is constructed from an out parameter", () => {
      expect(pipe).to.be.ok;
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
});
