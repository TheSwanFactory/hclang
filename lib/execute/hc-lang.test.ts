import { expect } from "jsr:@std/expect";
import { beforeEach, describe, it } from "jsr:@std/testing/bdd";
import { HCLang, StringMap } from "../mod.ts";

describe("HCLang", () => {
  let env: StringMap;
  let hc_lang: HCLang;

  beforeEach(() => {
    env = {};
    hc_lang = new HCLang(env);
  });

  describe("constructor", () => {
    it("should create a new instance of HCLang", () => {
      expect(hc_lang).toBeInstanceOf(HCLang);
    });
  });
});
