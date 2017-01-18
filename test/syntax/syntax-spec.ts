import { expect } from "chai";
import { exec } from "../../src/syntax";

describe("syntax", () => {
  describe("exec", () => {
    const input_string = "“Watson I need you”";
    const inline_comment = "#Inline#";
    const endline_comment = "#End-of-line\n";

    it("quines FrameStrings", () => {
      const result = exec(input_string);
      expect(result).to.equal(input_string);
    });

    it("eliminates inline comments", () => {
      const result = exec(inline_comment);
      expect(result).to.equal("()");
    });

    it("eliminates end-of-line comments", () => {
      const result = exec(endline_comment);

      expect(result).to.equal("()");
    });

    it("lexes both FrameStrings and comments", () => {
      const input = input_string + inline_comment;
      const result = exec(input);

      expect(result).to.equal(input_string);
    });

    it("evaluates FrameStrings", () => {
      const part1 = "“Hello, ”";
      const part2 = "“World!”";
      const input = `${part1}${part2}`
      const result = exec(input);

      expect(result).to.equal("“Hello, World!”");
    });
  });
});
