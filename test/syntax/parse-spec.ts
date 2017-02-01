import { expect } from "chai";
import * as parse from "../../src/syntax/parse";
import * as frame from "../../src/frames";
import * as ops from "../../src/ops";

describe.only("Parse", () => {
  const content = new frame.FrameString("content");
  const token = new parse.ParseToken(content);
  const symbol = frame.FrameSymbol.for(",");
  const terminal = new parse.ParseTerminal(symbol);
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
    it("is exported", () => {
      expect(parse.ParseTerminal).to.be.ok;
    });

    it("is constructed from a FrameSymbol", () => {
      expect(terminal).to.be.ok;
    });

    it("returns bound Op when got", () => {
      const op = (origin: frame.Frame, parameter: frame.Frame) => {
        return origin;
      };
      const dict = {",": op};
      const lookup = new ops.FrameOps(dict);
      const curry = lookup.get(",", pipe);
      const expected = curry.call(token);
      expect(curry).to.not.equal(frame.Frame.missing);
      expect(expected).to.equal(pipe);

      pipe.up = lookup;
      const curry2 = pipe.call(symbol);
      expect(curry2.toString()).to.equal(curry.toString());


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
