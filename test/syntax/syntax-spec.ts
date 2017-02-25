import { expect } from "chai";
import { exec } from "../../src/syntax";

describe("syntax exec", () => {
  describe("terminators", () => {
    it("evaluates newline to nothing", () => {
      const result = exec("\n");
      expect(result).to.equal("");
    });

    it("evaluates spaces to nothing", () => {
      const result = exec("  ");
      expect(result).to.equal("");
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
  });
});
