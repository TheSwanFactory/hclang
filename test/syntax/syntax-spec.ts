import { expect } from "chai";
import { exec } from "../../src/syntax";

describe.only("syntax exec", () => {
  describe("terminators", () => {
    it.skip("evaluates empty string to nothing", () => {
      const result = exec("");
      expect(result).to.equal("");
    });

    it("evaluates newline to nil", () => {
      const result = exec("\n");
      expect(result).to.equal("()");
    });

    it.skip("evaluates multiple newlines as sequence of nils", () => {
      const result = exec("\n\n");
      expect(result).to.equal("()\n()");
    });

    it("evaluates spaces to nil", () => {
      const result = exec("  ");
      expect(result).to.equal("()");
    });
  });

  describe("strings", () => {
    const input_string = "“Watson I need you”";
    const inline_comment = "#Inline#";
    const endline_comment = "#End-of-line\n";

    it("quines FrameStrings", () => {
      const result = exec(input_string);
      expect(result).to.equal(input_string);
    });

    it("evaluates inline comments to nil", () => {
      const result = exec(inline_comment);
      expect(result).to.equal("()");
    });

    it("evaluates end-of-line comments to nil", () => {
      const result = exec(endline_comment);
      expect(result).to.equal("()");
    });


    it("lexes both FrameStrings and comments", () => {
      const input = input_string + inline_comment;
      const result = exec(input);

      expect(result).to.equal(input_string);
    });

    it("handles spaces inside expressions", () => {
      const input = input_string + " " + inline_comment;
      const result = exec(input);

      expect(result).to.equal(input_string);
    });

    it.skip("evaluates multiple FrameStrings", () => {
      const part1 = "“Hello, ”";
      const part2 = "“World!”";
      const expr = `${part1}${part2}`;
      const expr_result = exec(expr);

      expect(expr_result).to.equal("“Hello, World!”");

      const lines = `${part1}\n${part2}`;
      const lines_result = exec(lines);
      expect(lines_result).to.equal("“Hello,”\n“ World!”");
    });
  });
});
