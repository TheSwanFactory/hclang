import chai = require("chai");
chai.use(require("chai-pretty-expect"));
const expect = chai.expect;
import * as parse from "../../src/syntax/parse";
import * as frame from "../../src/frames";
import * as ops from "../../src/ops";

describe("Parse", () => {
  const content = new frame.FrameString("content");
  const content_string = content.toString();
  const token = new parse.ParseToken(content);
  const symbol = frame.FrameSymbol.for(",");

  let out: frame.FrameArray;
  let pipe: parse.ParsePipe;
  beforeEach(() => {
    out = new frame.FrameArray([]);
    pipe = new parse.ParsePipe(out);
  });

  describe("ParseToken", () => {
    it("is exported", () => {
      expect(parse.ParseToken).to.be.ok;
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
      expect(parse.ParsePipe).to.be.ok;
    });

    it("is constructed from an out parameter", () => {
      expect(pipe).to.be.ok;
    });

    it("emits an empty Expr when called with end()", () => {
      const result = pipe.call(frame.FrameSymbol.end());
      expect(result.toString()).to.equal("()");
    });

    it("emits literal when called with token", () => {
      const result = pipe.call(token);
      expect(result.toString()).to.equal(content_string);
      expect(out.at(0).toString()).to.equal(content_string);
    });
  });

});
