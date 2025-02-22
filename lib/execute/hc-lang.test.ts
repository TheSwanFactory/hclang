import { expect } from "jsr:@std/expect";
import { beforeEach, describe, it } from "jsr:@std/testing/bdd";
import { HCLang } from "../mod.ts";

describe("HCLang", () => {
  let hc_lang: HCLang;

  beforeEach(() => {
    hc_lang = new HCLang({});
  });

  describe("constructor", () => {
    it("should create a new instance of HCLang", () => {
      expect(hc_lang).toBeInstanceOf(HCLang);
    });

    it("should initialize the context with the provided environment", () => {
      expect(hc_lang.getContextString()).toEqual("");
    });

    it("should initialize the history array with an empty array", () => {
      expect(hc_lang.getHistory()).toEqual([]);
    });

    describe("call", () => {
      it("should execute the given input string and return the result as a string", async () => {
        const result = await hc_lang.call("1 + 1");
        expect(result).toEqual("2");
      });

      it("should add the input-output pair to the history array", async () => {
        await hc_lang.call("1 + 1");
        expect(hc_lang.getHistory()).toEqual([{ input: "1 + 1", output: "2" }]);

        // should clear history when reset
        hc_lang.reset();
        expect(hc_lang.getHistory()).toEqual([]);
      });
    });
  });
});
