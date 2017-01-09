import { expect } from "chai";
import { exec } from "../../src/syntax";

describe.only("syntax", () => {
  describe("exec", () => {
    const input_string = "“Watson I need you”";
    const input_comment = "#Ignore this#";

    it("quines FrameStrings", () => {
      const result = exec(input_string);
      expect(result).to.equal("[" + input_string + "]");
    });

    it("eliminates inline comments", () => {
      const result = exec(input_comment);
      expect(result).to.equal("[" + "]");
    });

    it("eliminates end-of-ine comments", () => {
      const input = "#Ignore this\n";
      const result = exec(input);

      expect(result).to.equal("[" + "]");
    });

    it("lexes both FrameStrings and comments", () => {
      const input = input_string + input_comment;
      const result = exec(input);

      expect(result).to.equal("[" + input_string + "]");
    });

    it("evaluates FrameStrings", () => {
      const part1 = "“Hello, ”";
      const part2 = "“World!”";
      const input = `${part1} ${part2}`
      const result = exec(input);

      expect(result).to.equal("[" + "“Hello, World!”" + "]");
    });
  });
});
