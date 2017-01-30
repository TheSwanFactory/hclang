import { expect } from "chai";
import * as parse from "../../src/syntax/parse";

describe("ParsePipe", () => {
  it("is exported", () => {
    expect(parse.ParsePipe).to.be.ok;
  });
});
