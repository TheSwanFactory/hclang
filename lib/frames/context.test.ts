import { expect } from "jsr:@std/expect@^0.219.1";
import { describe, it } from "jsr:@std/testing@^1.0.10/bdd";

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
