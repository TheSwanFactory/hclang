import { expect } from "jsr:@std/expect@^0.219.1";
import { describe, it } from "jsr:@std/testing@^1.0.10/bdd";
import { MemoryStore } from "../frames.ts";
import { STANDARD_SOURCES } from "./standard-sources.ts";
import { withStandardModules } from "./standard-modules.ts";

// The overlay's rules are `ResourceMapStore`'s own tests, and
// `deno task modules:check` keeps the embed equal to `lib/modules/*.hc`.
describe("withStandardModules", () => {
  it("serves every embedded module read-only and delegates the rest", () => {
    const fresh = new MemoryStore("fresh");
    const store = withStandardModules(fresh);

    expect(STANDARD_SOURCES.size).toBeGreaterThan(0);
    for (const [key, content] of STANDARD_SOURCES) {
      expect(store.read(key)).toEqual({ ok: true, content });
      expect(store.write(key, "overwrite")).toEqual({
        ok: false,
        reason: "resource-read-only",
      });
    }
    expect(store.write("notes.txt", "kept")).toEqual({
      ok: true,
      content: "kept",
    });
    expect(fresh.read("notes.txt")).toEqual({ ok: true, content: "kept" });
  });
});
