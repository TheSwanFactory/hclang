import { expect } from "chai";
import * as pipe from "../../src/syntax/lex";

describe.only("pipeline", () => {
  describe("LexPipe", () => {
    it("is exported", () => {
      expect(pipe.LexPipe).to.be.ok;
    });
  });
});
