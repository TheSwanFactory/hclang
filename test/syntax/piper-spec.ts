import { expect } from "chai";
import * as frame from "../../src/frames";
import * as lex from "../../src/syntax/lex-pipe";
import * as parse from "../../src/syntax/parse";

import { piper } from "../../src/syntax/piper";

describe("Piper", () => {
  it("is exported", () => {
    expect(piper).to.be.ok;
  });

  it("returns empty array for empty string", () => {
    const result = piper.call("");
    expect(result.toString()).to.equal("[]");
  });
});
