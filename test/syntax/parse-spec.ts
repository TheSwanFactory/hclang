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
  });

  describe("ParsePipe", () => {
    it("is exported", () => {
      expect(parse.ParsePipe).to.be.ok;
    });
  });
});
