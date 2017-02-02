import chai = require("chai");
chai.use(require("chai-pretty-expect"));
const expect = chai.expect;
import * as parse from "../../src/syntax/parse";
import * as frame from "../../src/frames";
import * as ops from "../../src/ops";

describe("Parse", () => {
  const content = new frame.FrameString("content");
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

  describe("ParseTerminal", () => {
    const op = (callee: frame.Frame, parameter: frame.Frame) => {
      // const origin = callee as parse.ParsePipe;
      return content;
    };
    const terminal = new parse.ParseTerminal(op);
    it("is exported", () => {
      expect(parse.ParseTerminal).to.be.ok;
    });

    it("is constructed from a CurryFunction", () => {
      expect(terminal).to.be.ok;
    });

    it("invokes op when called", () => {
      const pipeString = new frame.FrameString(pipe.toString());
      const result = pipe.call(terminal);
      expect(result).to.equal(content);
    });
  });

  describe("ParsePipe", () => {
    it("is exported", () => {
      expect(parse.ParsePipe).to.be.ok;
    });

    it("is constructed from an output Frame", () => {
      expect(pipe).to.be.ok;
    });

    it("appends ParseToken content when called", () => {
      const result = pipe.call(token);
      expect(result).to.be.ok;
    });
  });
});