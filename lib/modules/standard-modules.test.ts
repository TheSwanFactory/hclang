import { expect } from "jsr:@std/expect@^0.219.1";
import { describe, it } from "jsr:@std/testing@^1.0.10/bdd";
// The maintained artifact itself, read by the module loader, so this test needs
// no read permission and compares against no private copy.
import maintainedFigures from "./figures.hc" with { type: "text" };
import { MemoryStore } from "../frames.ts";
import { FIGURES_SOURCE } from "./figures-source.ts";
import {
  FIGURES_MODULE_KEY,
  standardModules,
  withStandardModules,
} from "./standard-modules.ts";

describe("standard modules", () => {
  it("embeds the maintained Figures source exactly", () => {
    // A stale embed fails here. Regenerate it with `deno task modules:embed`.
    expect(FIGURES_SOURCE).toEqual(maintainedFigures);
  });

  it("serves the embed under one canonical key", () => {
    expect([...standardModules().keys()]).toEqual(["modules/figures.hc"]);
    expect(standardModules().get(FIGURES_MODULE_KEY)).toEqual(
      maintainedFigures,
    );
  });

  it("overlays them read-only and leaves every other path to the store", () => {
    const fresh = new MemoryStore("fresh");
    const store = withStandardModules(fresh);

    expect(store.read(FIGURES_MODULE_KEY)).toEqual({
      ok: true,
      content: maintainedFigures,
    });
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
