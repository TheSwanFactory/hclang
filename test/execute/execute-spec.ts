import { expect } from "chai";
import { execute } from "../../src/execute";

describe("execute", () => {
  const input_string = "“Watson I need you”";
  const other_string = "“Holmes I need you”";
  const both_strings = `${input_string}\n${other_string}`;
  const inline_comment = "#Inline#";
  const endline_comment = "#End-of-line\n";
  const spaces = "  ";

  describe("terminators", () => {
    it("evaluates spaces to nothing", () => {
      const result = execute(spaces);
      expect(result).to.equal("");
    });

    describe("newline", () => {
      it("evaluates to nothing", () => {
        const result = execute("\n");
        expect(result).to.equal("");
      });

      it("does not break strings", () => {
        const source = "“Hello,\n World”";
        const result = execute(source);
        expect(result).to.equal(source);
      });

      it("breaks expressions", () => {
        const result = execute(both_strings);
        console.error(result);
        expect(result).to.equal(both_strings);
      });

      it("breaks expressions after end-of-line comments", () => {
        const source = `${input_string}${endline_comment}${other_string}`;
        const result = execute(source);
        expect(result).to.equal(both_strings);
      });
    });
  });

  describe("tokens", () => {

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
