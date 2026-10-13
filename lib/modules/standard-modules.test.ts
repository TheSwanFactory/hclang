import { expect } from "jsr:@std/expect@^0.219.1";
import { describe, it } from "jsr:@std/testing@^1.0.10/bdd";
// The maintained artifact itself, read by the module loader, so this test needs
// no read permission and compares against no private copy.
import maintainedFigures from "./figures.hc" with { type: "text" };
import { MemoryStore } from "../frames.ts";
import { STANDARD_SOURCES } from "./standard-sources.ts";
import { standardModules, withStandardModules } from "./standard-modules.ts";

const FIGURES = "modules/figures.hc";

// `standard-sources.test.ts`, generated with the embed, compares every embedded
// module with its maintained file.
describe("standard modules", () => {
  it("serves every embedded module under its canonical key", () => {
    expect(standardModules()).toBe(STANDARD_SOURCES);
    for (const key of standardModules().keys()) {
      expect(key).toMatch(/^modules\/[A-Za-z0-9][A-Za-z0-9_-]*\.hc$/);
    }
    expect(standardModules().get(FIGURES)).toEqual(maintainedFigures);
  });

  it("overlays them read-only and leaves every other path to the store", () => {
    const fresh = new MemoryStore("fresh");
    const store = withStandardModules(fresh);

    expect(store.read(FIGURES)).toEqual({
      ok: true,
      content: maintainedFigures,
    });
    expect(store.write(FIGURES, "overwrite")).toEqual({
      ok: false,
      reason: "resource-read-only",
    });
    expect(fresh.read(FIGURES)).toEqual({
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
