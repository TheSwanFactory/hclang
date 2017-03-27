import { expect } from "chai";
import { execute } from "../../src/execute";

describe("execute", () => {
  describe("terminators", () => {
    it("evaluates spaces to nothing", () => {
      const result = execute("  ");
      expect(result).to.equal("");
    });

    describe("newline", () => {
      it("evaluates to nothing", () => {
        const result = execute("\n");
        expect(result).to.equal("");
      });

      it("breaks expressions", () => {
        const result = execute("\n");
        expect(result).to.equal("");
      });

      it("breaks expressions after end-of-line comments", () => {
        const result = execute("\n");
        expect(result).to.equal("");
      });

      it("does not break strings", () => {
        const result = execute("\n");
        expect(result).to.equal("");
      });
    });
  });

  describe("tokens", () => {
    const input_string = "“Watson I need you”";
    const other_string = "“Holmes I need you”";
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

    it("handles spaces after string", () => {
      const space_suffix = other_string + spaces;
      const result = execute(space_suffix);
      expect(result).to.equal(other_string);
    });

    it("handles spaces between strings", () => {
      const space_inside = other_string + spaces + inline_comment;
      const result_inside = execute(space_inside);
      expect(result_inside).to.equal(other_string);
    });
  });
});
