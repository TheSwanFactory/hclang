import { expect } from "jsr:@std/expect@^0.219.1";
import { describe, it } from "jsr:@std/testing@^1.0.10/bdd";
import { MemoryStore } from "../lib/frames.ts";
import {
  FIGURES_MODULE_KEY,
  standardModules,
  withStandardModules,
} from "./standard-modules.ts";

describe("standard modules", () => {
  it("serves the maintained Figures bytes under one canonical key", async () => {
    // Compared with the maintained artifact itself, not with a private copy.
    const maintained = await Deno.readTextFile(
      new URL("../lib/modules/figures.hc", import.meta.url),
    );

    expect([...standardModules().keys()]).toEqual(["modules/figures.hc"]);
    expect(standardModules().get(FIGURES_MODULE_KEY)).toEqual(maintained);
  });

  it("overlays them read-only and leaves every other path to the store", () => {
    const fresh = new MemoryStore("fresh");
    const store = withStandardModules(fresh);

    expect(store.write(FIGURES_MODULE_KEY, "overwrite")).toEqual({
      ok: false,
      reason: "resource-read-only",
    });
    expect(fresh.read(FIGURES_MODULE_KEY)).toEqual({
      ok: false,
      reason: "resource-absent",
    });
    expect(store.read("modules/other.hc")).toEqual({
      ok: false,
      reason: "resource-absent",
    });
    expect(store.write("notes.txt", "kept")).toEqual({
      ok: true,
      content: "kept",
    });
    expect(fresh.read("notes.txt")).toEqual({ ok: true, content: "kept" });
    expect(store.describe()).toEqual("fresh");
  });
});
