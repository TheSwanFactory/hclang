
import { expect } from "chai";
import {} from "mocha";
import { Token } from "../../src/execute/lex";
import { ParsePipe } from "../../src/execute/parse-pipe";
import * as frame from "../../src/frames";
import * as ops from "../../src/ops";

describe("Parse", () => {
  const content = new frame.FrameString("content");
  const token = new Token(content);
  const symbol = frame.FrameSymbol.for(",");

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
      const result = out.call(token);
      expect(out.asArray().length).to.equal(1);
      expect(out.at(0)).to.equal(content);
    });
  });

  describe("ParsePipe", () => {
    it("is exported", () => {
      expect(ParsePipe).to.be.ok;
    });

    it("is constructed from an out parameter", () => {
      expect(pipe).to.be.ok;
    });

    it("emits an empty Group on `end`", () => {
      const result = pipe.call(frame.FrameSymbol.end());
      expect(result).to.be.instanceOf(frame.FrameGroup);
      expect(result.toString()).to.equal("()");
      expect(out.size()).to.equal(1);
      const group = out.at(0);
      expect(group).to.equal(result);
    });

    it("adds token contents on `call`", () => {
      expect(pipe.length()).to.equal(0);
      pipe.call(token);
      expect(pipe.length()).to.equal(1);
      pipe.call(token);
      expect(pipe.length()).to.equal(2);
    });

    it("converts contents to Expr on `next`", () => {
      pipe.call(token);
      expect(pipe.length()).to.equal(1);
      pipe.next(false);
      expect(pipe.length()).to.equal(0);
    });

    it("emits Grouped expr on `finish`", () => {
      pipe.call(token);
      const result = pipe.call(frame.FrameSymbol.end());
      expect(result).to.be.instanceOf(frame.FrameGroup);
      expect(out.size()).to.equal(1);
      const expr = out.at(0);
      expect(expr).to.be.instanceOf(frame.FrameGroup);
      expect(expr.toString()).to.equal(`((${content}))`);
    });
  });

});
