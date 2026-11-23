import { expect } from "@std/expect";
import { describe, it } from "@std/testing/bdd";

import { type Context, contextString, Frame } from "../frames.ts";

describe("context", () => {
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
