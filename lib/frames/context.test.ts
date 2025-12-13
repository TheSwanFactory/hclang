import { expect } from "jsr:@std/expect@^0.219.1";
import { describe, it } from "jsr:@std/testing@^1.0.10/bdd";

import { type Context, contextEqual, contextString, Frame } from "../frames.ts";

describe("context", () => {
  describe("contextEqual", () => {
    const base: Context = { key: Frame.nil };

    it("returns true for identical contexts", () => {
      const same: Context = { key: Frame.nil };
      expect(contextEqual(base, same)).toBe(true);
    });

    it("returns false for different contexts", () => {
      const different: Context = { key: Frame.all };
      const other: Context = { other: Frame.nil };
      const more: Context = { key: Frame.nil, other: Frame.nil };
      expect(contextEqual(base, different)).toBe(false);
      expect(contextEqual(base, more)).toBe(false);
      expect(contextEqual(base, other)).toBe(false);
    });
  });
  describe("contextString", () => {
    const context: Context = { nil: Frame.nil, all: Frame.all };
    const result = contextString(context);
    it("returns a string", () => {
      expect(typeof result).toBe("string");
    });
    it("returns a string of meta_pairs", () => {
      expect(result).toEqual(".nil (); .all <>;");
    });
  });
});
