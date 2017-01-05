import { expect } from "chai";
import { exec } from "../../src/execs";

describe("exec", () => {
  it("quines FrameStrings", () => {
    const input = "“Watson I need you”";
    const result = exec(input);

    expect(result).to.equal(input);
  });

  it("evaluates FrameStrings", () => {
    const part1 = "“Hello, ”";
    const part2 = "“World!”";
    const input = `${part1} ${part2}`
    const result = exec(input);

    expect(result).to.equal("“Hello, World!”");
  });
});
