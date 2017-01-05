import { expect } from "chai";
import { exec } from "../../src/execs";

describe("exec", () => {
  it("quines FrameStrings", () => {
    const input = "“Watson I need you”";
    const result = exec(input);
    expect(result).to.equal(input);
  });
});
