import { expect } from "chai";
import * as lex from "../../src/syntax/lex";

describe("LexPipe", () => {
  it("is exported", () => {
    expect(lex.LexPipe).to.be.ok;
  });
});
