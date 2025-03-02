import { expect } from "npm:chai";
import { describe, it } from "jsr:@std/testing/bdd";
import { HCEval } from "../lib/execute/hc-eval.ts";
import { Frame } from "../lib/frames/frame.ts";

describe("testdoc", () => {
  describe("schema operations", () => {
    it("combines schema with number", () => {
      const hc = new HCEval(Frame.nil);
      const result = hc.call("<> 1");
      expect(result?.toString()).to.equal("<1>");
    });

    it("combines schema with expression", () => {
      const hc = new HCEval(Frame.nil);
      const result = hc.call("<> ()");
      expect(result?.toString()).to.equal("<>");
    });
  });

  describe("name operations", () => {
    it("defines name with schema and number", () => {
      const hc = new HCEval(Frame.nil);
      const result = hc.call(".one <1> 1");
      expect(result?.toString()).to.equal("one");
    });

    it("handles alias with number and type error", () => {
      const hc = new HCEval(Frame.nil);
      // First define one
      hc.call(".one <1> 1");
      const result = hc.call("@one 2");
      // The expected output should contain a type error
      const output = result?.toString() || "";
      expect(output).to.include("type-error");
      expect(output).to.include("one");
    });
  });

  describe("enumerated types", () => {
    it("defines enumerated type", () => {
      const hc = new HCEval(Frame.nil);
      hc.call("@enum123 <1,2,3>");
      const result = hc.call("enum123");
      expect(result?.toString()).to.equal("<1,2,3>");
    });

    it("validates against enumerated type", () => {
      const hc = new HCEval(Frame.nil);
      hc.call("@enum123 <1,2,3>");
      const result = hc.call("@enum123 4");
      // Should fail validation
      const output = result?.toString() || "";
      expect(output).to.include("enum123");
    });
  });

  describe("conditional expressions", () => {
    it("evaluates true condition", () => {
      const hc = new HCEval(Frame.nil);
      hc.call(".true 1");
      const result = hc.call("true .? `Yes` .: `No`");
      expect(result?.toString()).to.equal("`Yes`");
    });

    it("evaluates false condition", () => {
      const hc = new HCEval(Frame.nil);
      hc.call(".false 0");
      const result = hc.call("false .? `Yes` .: `No`");
      expect(result?.toString()).to.equal("`No`");
    });
  });

  describe("selectors", () => {
    it("selects properties from object", () => {
      const hc = new HCEval(Frame.nil);
      const result = hc.call("<.x, .z> [.x 1; .y 2; .z 3;]");
      expect(result?.toString()).to.equal("[1, 3]");
    });
  });
});
