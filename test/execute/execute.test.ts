import { expect } from "npm:chai";
import { describe, it } from "jsr:@std/testing/bdd";

import { execute } from "../../src/mod.ts";

describe("execute", () => {
  const input_string = "“Watson I need you”";
  const other_string = "“Holmes I need you”";
  const both_strings = `${input_string}\n${other_string}`;
  const inline_comment = "#Inline comment#";
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
        expect(result).to.equal(both_strings);
      });
    });
  });

  describe("tokens.strings", () => {
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
  });

  describe("numbers", () => {
    it("returns numbers", () => {
      const input = "123";
      const result = execute(input);
      expect(result.toString()).to.equal(input);

      const digit = "9";
      const result2 = execute(digit);
      expect(result2.toString()).to.equal(digit);
    });

    it("returns numbers after inline comment", () => {
      const input = "#abc#123";
      const result = execute(input);
      expect(result.toString()).to.equal("123");
    });

    it("returns numbers before inline comment", () => {
      const input = "123#abc#";
      const result = execute(input);
      expect(result.toString()).to.equal("123");
    });

    it("returns numbers before endcomment", () => {
      const input = "123#abc";
      const result = execute(input);
      expect(result.toString()).to.equal("123");
    });

    it("joins blobs", () => {
      const bithex = execute("0b1 0x5");
      expect(bithex.toString()).to.equal("0b10101");

      const dual0 = execute("0b00 0b00");
      expect(dual0.toString()).to.equal("0b0000");

      const right0 = execute("0b01 0b00");
      expect(right0.toString()).to.equal("0b0100");

      const left0 = execute("0b00 0b01");
      expect(left0.toString()).to.equal("0b0001");
    });
  });

  describe("operators", () => {
    it("accepts them as symbols", () => {
      const input = ".&";
      const result = execute(input);
      expect(result.toString()).to.include("&");
    });

    it("curries", () => {
      const input = "[`a`].&";
      const result = execute(input);
      expect(result).to.include("FrameCurry");
    });
  });

  // FIXME: Make FrameBytes work with IArrayConstructor?
  describe.skip("byte.strings", () => {
    it("reads n characters", () => {
      const input = "\\1\\a";
      const result = execute(input);
      expect(result.toString()).to.equal(input);
    });
  });
});
