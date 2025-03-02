import { expect } from "npm:chai";
import { describe, it } from "jsr:@std/testing/bdd";
import { HCEval } from "../lib/execute/hc-eval.ts";

describe("testdoc", () => {
  describe("schema operations", () => {
    it("combines schema with number", async () => {
      const hc = new HCEval();
      const result = await hc.evaluate("<> 1");
      expect(result.toString()).to.equal("<1>");
    });

    it("combines schema with expression", async () => {
      const hc = new HCEval();
      const result = await hc.evaluate("<> ()");
      expect(result.toString()).to.equal("<>");
    });
  });

  describe("name operations", () => {
    it("defines name with schema and number", async () => {
      const hc = new HCEval();
      const result = await hc.evaluate(".one <1> 1");
      expect(result.toString()).to.equal("one");
    });

    it("handles alias with number and type error", async () => {
      const hc = new HCEval();
      // First define one
      await hc.evaluate(".one <1> 1");
      const result = await hc.evaluate("@one 2");
      // The expected output should contain a type error
      const output = result.toString();
      expect(output).to.include("type-error");
      expect(output).to.include("one");
    });
  });

  describe("enumerated types", () => {
    it("defines enumerated type", async () => {
      const hc = new HCEval();
      await hc.evaluate("@enum123 <1,2,3>");
      const result = await hc.evaluate("enum123");
      expect(result.toString()).to.equal("<1,2,3>");
    });

    it("validates against enumerated type", async () => {
      const hc = new HCEval();
      await hc.evaluate("@enum123 <1,2,3>");
      const result = await hc.evaluate("@enum123 4");
      // Should fail validation
      const output = result.toString();
      expect(output).to.include("enum123");
    });
  });

  describe("conditional expressions", () => {
    it("evaluates true condition", async () => {
      const hc = new HCEval();
      await hc.evaluate(".true 1");
      const result = await hc.evaluate("true .? `Yes` .: `No`");
      expect(result.toString()).to.equal("`Yes`");
    });

    it("evaluates false condition", async () => {
      const hc = new HCEval();
      await hc.evaluate(".false 0");
      const result = await hc.evaluate("false .? `Yes` .: `No`");
      expect(result.toString()).to.equal("`No`");
    });
  });

  describe("selectors", () => {
    it("selects properties from object", async () => {
      const hc = new HCEval();
      const result = await hc.evaluate("<.x, .z> [.x 1; .y 2; .z 3;]");
      expect(result.toString()).to.equal("[1, 3]");
    });
  });
});
