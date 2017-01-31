import { expect } from "chai";
import * as parse from "../../src/syntax/parse";

describe("Parse", () => {
  describe("ParseToken", () => {
    it("is exported", () => {
      expect(parse.ParseToken).to.be.ok;
    });
  });
  describe("ParsePipe", () => {
    it("is exported", () => {
      expect(parse.ParsePipe).to.be.ok;
    });
  });
});
