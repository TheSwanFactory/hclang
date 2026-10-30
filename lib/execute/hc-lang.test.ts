import { expect } from "jsr:@std/expect@^0.219.1";
import { beforeEach, describe, it } from "jsr:@std/testing@^1.0.10/bdd";
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

      it("preserves file declarations between submissions", async () => {
        await hc_lang.call(".x 7;");

        expect(await hc_lang.call("x")).toEqual("7");
        expect(await hc_lang.call("$.x")).toEqual("7");

        hc_lang.reset();
        expect(await hc_lang.call("x")).toContain("$!.name-missing");
      });

      it("requires explicit access to host bindings", async () => {
        const hosted = new HCLang({ x: "2" });

        expect(await hosted.call("x")).toContain("$!.name-missing");
        expect(await hosted.call("$$.x")).toEqual("2");
      });
    });
  });

  describe("bundled hc/ files", () => {
    it("imports Figures from the bundle by name", async () => {
      const session = new HCLang();

      // Importing skips figures.hc's `; ` examples (#405) and runs only its
      // code, so an error-valued code line fails this import, and this test.
      const imported = await session.call("Figures <- './hc/figures.hc'");
      expect(imported).not.toContain("$!");
      expect(
        await session.call(
          "(Figures.inlay [] []) = []",
        ),
      ).toEqual("<>");
    });

    it("refuses writes to a bundled file and keeps every other path", async () => {
      const session = new HCLang();

      expect(await session.call("'./hc/figures.hc' “overwrite”"))
        .toContain("$!.resource-read-only");
      expect(await session.call("'./hc/other.hc' | “”"))
        .toContain("$!.resource-absent");
    });

    it("serves the bundle again after reset", async () => {
      const session = new HCLang();
      await session.call("'./notes.txt' “kept”");

      session.reset();
      expect(await session.call("'./notes.txt' | “”"))
        .toContain("$!.resource-absent");
      await session.call("Figures <- './hc/figures.hc'");
      expect(
        await session.call(
          "(Figures.inlay [] []) = []",
        ),
      ).toEqual("<>");
    });
  });
});
