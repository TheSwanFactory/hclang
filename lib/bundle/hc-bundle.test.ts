import { expect } from "jsr:@std/expect@^0.219.1";
import { describe, it } from "jsr:@std/testing@^1.0.10/bdd";
import { MemoryStore } from "../frames.ts";
import { HC_SOURCES } from "./hc-sources.ts";
import { withHCBundle } from "./hc-bundle.ts";

// The overlay's rules are `ResourceMapStore`'s own tests, and
// `deno task bundle:check` keeps the embed equal to `hc/*.hc`.
describe("withHCBundle", () => {
  it("serves every bundled file read-only and delegates the rest", () => {
    const fresh = new MemoryStore("fresh");
    const store = withHCBundle(fresh);

    expect(HC_SOURCES.size).toBeGreaterThan(0);
    for (const [key, content] of HC_SOURCES) {
      expect(key.startsWith("hc/")).toBe(true);
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
