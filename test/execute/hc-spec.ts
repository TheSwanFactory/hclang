
import { expect } from "chai";
import {} from "mocha";
import { HC, IProcessEnv } from "../../src/execute/hc-class";
import * as frame from "../../src/frames";

describe("HC", () => {
  let hc: HC;

  beforeEach(() => {
    hc = new HC();
  });

  it("is exported", () => {
    expect(HC).to.be.ok;
    expect(hc).to.be.ok;
  });

  it("returns Frame.nil for empty string", () => {
    const result = hc.evaluate("");
    expect(result.toString()).to.equal(frame.Frame.nil.toString());
  });

  describe("literals", () => {
    it("returns new value, if any", () => {
      const input = "“Hello, HC!”";
      const result = hc.evaluate(input);
      expect(result.toString()).to.equal(`${input}`);
    });

    it("joins multi-line doc-strings into strings", () => {
      const input = "```\nDoc String\n```";
      hc.evaluate(input);
      expect(hc.toString()).to.equal(`[“\nDoc String\n”]`);
    });

    it("returns numbers", () => {
      const input = "123";
      const result = hc.evaluate(input);
      expect(result).to.be.instanceof(frame.FrameNumber);
      expect(result.toString()).to.equal(input);
    });
  });

  describe("literals", () => {
    it("returns numbers", () => {
      const input = "123";
      const result = hc.evaluate(input);
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
      const hc2 = new HC(env);
      hc2.evaluate(key) as frame.FrameArray;
      expect(hc2.size()).to.equal(1);
      const output = hc2.at(0);
      expect(output.toString()).to.equal(frame_value.toString());
    });

    it("evaluates names to symbols", () => {
      hc.evaluate(`.${key}`) as frame.FrameArray;
      expect(hc.size()).to.equal(1);
      const output = hc.at(0);
      expect(output).to.be.instanceof(frame.FrameSymbol);
    });

    it("set symbols in result", () => {
      hc.evaluate(setting) as frame.FrameArray;
      const extracted = hc.get(key);
      expect(extracted.toString()).to.equal(frame_value.toString());
    });

    it("evaluates created symbols", () => {
      const input = `${setting}\n${key}`;
      hc.evaluate(input) as frame.FrameArray;
      // console.error(`result:`);
      // console.error(result);

      expect(hc.size()).to.equal(2);
      const output = hc.at(1);
      expect(output.toString()).to.equal(frame_value.toString());
    });
  });

  describe.skip("groups", () => {
    it("returns FrameArray for empty []", () => {
      const result = hc.evaluate("[]");
      expect(result).to.be.instanceof(frame.FrameArray);
    });

    it("returns nil for empty ()", () => {
      const result = hc.evaluate("()");
      expect(result).to.equal(frame.Frame.nil);
    });

    it("returns closure for empty {}", () => {
      const result = hc.evaluate("{}");
      expect(result).to.be.instanceof(frame.FrameLazy);
    });
  });
});
