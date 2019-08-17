
import { expect } from "chai";
import {} from "mocha";
import { HC } from "../../src/execute/hc";
import * as frame from "../../src/frames";

describe.only("HC", () => {
  let hc: HC;

  beforeEach(() => {
    hc = new HC();
  });

  it("is exported", () => {
    expect(HC).to.be.ok;
    expect(hc).to.be.ok;
  });

  it("evalutes iteratively when called", () => {
    expect(HC).to.be.ok;
    expect(hc).to.be.ok;
  });

  it("joins multi-line doc-strings into strings", () => {
    const input = "```\nDoc String\n```";
    const result = hc.evaluate(input);
    expect(result.toString()).to.equal(`[“\nDoc String\n”]`);
  });

  describe("symbols", () => {
    const key = "key";
    const value = "value";
    const frame_value = new frame.FrameString("value");
    const setting = `.${key} ${frame_value}`;

    it("evaluates in context", () => {
      const context: frame.Context = {key: frame_value};
      const hc2 = new HC(context);
      const result = hc2.evaluate(key) as frame.FrameArray;
      expect(result.size()).to.equal(1);
      const output = result.at(0);
      expect(output.toString()).to.equal(frame_value.toString());
    });

    it("evaluates names to symbols", () => {
      const result = hc.evaluate(`.${key}`) as frame.FrameArray;
      expect(result.size()).to.equal(1);
      const output = result.at(0);
      expect(output).to.be.instanceof(frame.FrameSymbol);
    });

    it("set symbols in result", () => {
      const result = hc.evaluate(setting) as frame.FrameArray;
      const extracted = result.get(key);
      expect(extracted.toString()).to.equal(frame_value.toString());
    });

    it("evaluates created symbols", () => {
      const input = `${setting}\n${key}`;
      const result = hc.evaluate(input) as frame.FrameArray;
      // console.error(`result:`);
      // console.error(result);

      expect(result.size()).to.equal(2);
      const output = result.at(1);
      expect(output.toString()).to.equal(frame_value.toString());
    });
  });
});
