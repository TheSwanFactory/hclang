import { expect } from "chai";
import * as parse from "../../src/syntax/parse";
import * as frame from "../../src/frames";

describe.only("Parse", () => {
  describe("ParseToken", () => {
    const content = new frame.FrameString("content");
    const token = new parse.ParseToken(content);
    it("is exported", () => {
      expect(parse.ParseToken).to.be.ok;
    });

    it("is constructed from a Frame", () => {
      expect(token).to.be.ok;
    });

    it("calls argument with content when called", () => {
      const out = new frame.FrameArray([]);
      const result = token.call(out);
      expect(out.asArray().length).to.equal(1);
      expect(out.at(0)).to.equal(content);
    });
  });

  describe("ParsePipe", () => {
    it("is exported", () => {
      expect(parse.ParsePipe).to.be.ok;
    });
  });
});
