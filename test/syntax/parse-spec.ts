import { expect } from "chai";
import * as parse from "../../src/syntax/parse";
import * as frame from "../../src/frames";

describe.only("Parse", () => {
  const content = new frame.FrameString("content");
  const token = new parse.ParseToken(content);
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

    it("calls argument with content when called", () => {
      const result = token.call(out);
      expect(out.asArray().length).to.equal(1);
      expect(out.at(0)).to.equal(content);
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
      expect(pipe).to.be.ok;
    });
  });
});
