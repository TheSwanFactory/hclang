
import { expect } from "chai";
import {} from "mocha";
import { HCLang, IProcessEnv } from "../../src/execute/hc-lang";
import * as frame from "../../src/frames";

describe("HCLang", () => {
  let hclang: HCLang;

  beforeEach(() => {
    hclang = new HCLang();
  });

  it("is exported", () => {
    expect(HCLang).to.be.ok;
    expect(hclang).to.be.ok;
  });

  it("returns Frame.nil for empty string", () => {
    const result = hclang.evaluate("");
    expect(result.toString()).to.equal(frame.Frame.nil.toString());
  });

  describe("literals", () => {
    it("returns new value, if any", () => {
      const input = "“Hello, HCLang!”";
      const result = hclang.evaluate(input);
      expect(result.toString()).to.equal(`${input}`);
    });

    it("joins multi-line doc-strings into strings", () => {
      const input = "```\nDoc String\n```";
      hclang.evaluate(input);
      expect(hclang.toString()).to.equal(`[“\nDoc String\n”]`);
    });

    it("returns numbers", () => {
      const input = "123";
      const result = hclang.evaluate(input);
      expect(result).to.be.instanceof(frame.FrameNumber);
      expect(result.toString()).to.equal(input);
    });
  });

  describe("symbols", () => {
    const key = "key";
    const value = "value";
    const frame_value = new frame.FrameString(value);
    const setting = `.${key} ${frame_value}`;

    it("evaluates in env", () => {
      const env: IProcessEnv = {key: value};
      const hclang2 = new HCLang(env);
      hclang2.evaluate(key) as frame.FrameArray;
      expect(hclang2.size()).to.equal(1);
      const output = hclang2.at(0);
      expect(output.toString()).to.equal(frame_value.toString());
    });

    it("evaluates names to symbols", () => {
      hclang.evaluate(`.${key}`) as frame.FrameArray;
      expect(hclang.size()).to.equal(1);
      const output = hclang.at(0);
      expect(output).to.be.instanceof(frame.FrameSymbol);
    });

    it("set symbols in result", () => {
      hclang.evaluate(setting) as frame.FrameArray;
      const extracted = hclang.get(key);
      expect(extracted.toString()).to.equal(frame_value.toString());
    });

    it("evaluates created symbols", () => {
      const input = `${setting}\n${key}`;
      hclang.evaluate(input) as frame.FrameArray;

      expect(hclang.size()).to.equal(2);
      const output = hclang.at(1);
      expect(output.toString()).to.equal(frame_value.toString());
    });

    it.skip("but doesn't return a value for a statement", () => {
      const input = `${setting},\n${key}`;
      hclang.evaluate(input) as frame.FrameArray;
      console.error("hclang", hclang);

      expect(hclang.size()).to.equal(1);
      const output = hclang.at(0);
      expect(output.toString()).to.equal(frame_value.toString());
    });

  });

  describe.skip("grouping", () => {
    it("returns FrameArray for empty []", () => {
      const result = hclang.evaluate("[]");
      expect(result).to.be.instanceof(frame.FrameArray);
    });

    it("returns nil for empty ()", () => {
      const result = hclang.evaluate("()");
      expect(result).to.equal(frame.Frame.nil);
    });

    it("returns closure for empty {}", () => {
      const result = hclang.evaluate("{}");
      expect(result).to.be.instanceof(frame.FrameLazy);
    });
  });
});
