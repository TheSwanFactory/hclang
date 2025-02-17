import { expect } from "npm:chai";
import { describe, it } from "jsr:@std/testing/bdd";

import {
  type Context,
  contextEqual,
  contextString,
  Frame,
} from "../../src/frames.ts";

describe("context", () => {
  describe("contextEqual", () => {
    const base: Context = { key: Frame.nil };

    it("returns true for identical contexts", () => {
      const same: Context = { key: Frame.nil };
      expect(contextEqual(base, same)).to.be.true;
    });

    it("returns false for different contexts", () => {
        const different: Context = { key: Frame.all };
        const other: Context = { other: Frame.nil };
        const more: Context = { key: Frame.nil, other: Frame.nil };
      expect(contextEqual(base, different)).to.be.false;
      expect(contextEqual(base, more)).to.be.false;
      expect(contextEqual(base, other)).to.be.false;
    });
  });
  describe("contextString", () => {
    const context: Context = { nil: Frame.nil, all: Frame.all };
    const result = contextString(context);
    it("returns a string", () => {
      expect(result).to.be.a("string");
    });
    it("returns a string of meta_pairs", () => {
      expect(result).to.equal(".nil (); .all <>;");
    });
  });
});
