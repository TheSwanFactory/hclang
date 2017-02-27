import { expect } from "chai";
import { execute } from "../../src/execute";

describe("execute", () => {
  describe("terminators", () => {
    it("evaluates newline to nothing", () => {
      const result = execute("\n");
      expect(result).to.equal("");
    });

    it("evaluates spaces to nothing", () => {
      const result = execute("  ");
      expect(result).to.equal("");
    });
  });

  describe("tokens", () => {
    const input_string = "“Watson I need you”";
    const inline_comment = "#Inline#";
    const endline_comment = "#End-of-line\n";
    const spaces = "  ";

    it("quines FrameStrings", () => {
      const result = execute(input_string);
      expect(result).to.equal(input_string);
    });

    it("evaluates inline comments to nothing", () => {
      const result = execute(inline_comment);
      expect(result).to.equal("");
    });

    it("evaluates end-of-line comments to nothing", () => {
      const result = execute(endline_comment);
      expect(result).to.equal("");
    });

    it("evaluates spaces to nothing", () => {
      const result = execute(spaces);
      expect(result).to.equal("");
    });

    it("lexes both FrameStrings and comments", () => {
      const input = input_string + inline_comment;
      const result = execute(input);

      expect(result).to.equal(input_string);
    });

    it("handles spaces inside expressions", () => {
      const input = input_string + spaces + inline_comment;
      const result = execute(input);

      expect(result).to.equal(input_string);
    });
  });
});
