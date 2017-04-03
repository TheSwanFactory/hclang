
import { expect } from "chai";
import {} from "mocha";
import { ParsePipe } from "../../src/execute/parse-pipe";
import { Token } from "../../src/execute/tokens";
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
    pipe = new ParsePipe(out);
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

    it("emits an empty Expr when called with end()", () => {
      const result = pipe.call(frame.FrameSymbol.end());
      expect(result).to.be.instanceOf(frame.FrameExpr);
      expect(result.toString()).to.equal("()");
      expect(out.size()).to.equal(1);
      const expr = out.at(0);
      expect(expr).to.be.instanceOf(frame.FrameExpr);
      expect(expr).to.equal(result);
    });

    it("emits expr when called with token (and end)", () => {
      pipe.call(token);
      const result = pipe.call(frame.FrameSymbol.end());
      expect(result).to.be.instanceOf(frame.FrameExpr);

      expect(out.size()).to.equal(1);
      const expr = out.at(0);
      expect(expr).to.be.instanceOf(frame.FrameExpr);
      expect(expr.toString()).to.equal(`(${content})`);
    });
  });

});
