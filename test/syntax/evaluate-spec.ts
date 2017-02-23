import { expect } from "chai";
import * as frame from "../../src/frames";
import * as lex from "../../src/syntax/lex-pipe";
import * as parse from "../../src/syntax/parse";

import { evaluate } from "../../src/syntax/evaluate";

describe("evaluate", () => {
  it("is exported", () => {
    expect(evaluate).to.be.ok;
  });

  it("returns empty array for empty string", () => {
    const result = evaluate.call("");
    expect(result.toString()).to.equal("[]");
  });

  it("quines string literal", () => {
    const hello = new frame.FrameString("Hello, HC!");
    const hello_string = hello.toString();
    const result = evaluate.call(hello_string);
    expect(result.toString()).to.equal(`[${hello_string}]`);
  });
});
