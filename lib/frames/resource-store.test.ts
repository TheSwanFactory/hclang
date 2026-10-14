import { expect } from "jsr:@std/expect@^0.219.1";
import { describe, it } from "jsr:@std/testing@^1.0.10/bdd";
import { MemoryStore, ResourceMapStore } from "../frames.ts";

const KEY = "modules/m.hc";

/** The overlay over a fresh store, with one mapped entry. */
const overlaid = (): { underlying: MemoryStore; store: ResourceMapStore } => {
  const underlying = new MemoryStore("fresh");
  const store = new ResourceMapStore(underlying, new Map([[KEY, "mapped"]]));
  return { underlying, store };
};

/** What constructing an overlay with one key threw, if anything. */
const rejection = (key: string): unknown => {
  try {
    new ResourceMapStore(new MemoryStore(), new Map([[key, "x"]]));
  } catch (error) {
    return error;
  }
  return undefined;
};

describe("ResourceMapStore", () => {
  it("reads a mapped entry and delegates every other read", () => {
    const { underlying, store } = overlaid();
    underlying.write("notes.txt", "kept");

    expect(store.read(KEY)).toEqual({ ok: true, content: "mapped" });
    expect(store.read("notes.txt")).toEqual({ ok: true, content: "kept" });
    expect(store.read("modules/other.hc")).toEqual({
      ok: false,
      reason: "resource-absent",
    });
  });

  it("refuses a mapped write and leaves the underlying store untouched", () => {
    const { underlying, store } = overlaid();

    expect(store.write(KEY, "overwrite")).toEqual({
      ok: false,
      reason: "resource-read-only",
    });
    expect(underlying.read(KEY)).toEqual({
      ok: false,
      reason: "resource-absent",
    });
    expect(store.read(KEY)).toEqual({ ok: true, content: "mapped" });
  });

  it("delegates every unmapped write", () => {
    const { underlying, store } = overlaid();

    expect(store.write("notes.txt", "new")).toEqual({
      ok: true,
      content: "new",
    });
    expect(underlying.read("notes.txt")).toEqual({ ok: true, content: "new" });
  });

  it("describes the underlying store", () => {
    expect(overlaid().store.describe()).toEqual("fresh");
  });

  it("copies its entries, so the caller's map cannot change them", () => {
    const entries = new Map([[KEY, "mapped"]]);
    const store = new ResourceMapStore(new MemoryStore(), entries);

    entries.set(KEY, "changed");
    entries.set("modules/late.hc", "late");

    expect(store.read(KEY)).toEqual({ ok: true, content: "mapped" });
    expect(store.read("modules/late.hc")).toEqual({
      ok: false,
      reason: "resource-absent",
    });
  });

  it("overlays the entries it checked once over every store it is given", () => {
    const entries = new Map([[KEY, "mapped"]]);
    const overlay = ResourceMapStore.overlay(entries);
    entries.set(KEY, "changed");
    const first = new MemoryStore("first");
    const second = new MemoryStore("second");

    for (const store of [overlay(first), overlay(second)]) {
      expect(store.read(KEY)).toEqual({ ok: true, content: "mapped" });
      expect(store.write(KEY, "x")).toEqual({
        ok: false,
        reason: "resource-read-only",
      });
    }
    overlay(first).write("notes.txt", "kept");
    expect(first.read("notes.txt")).toEqual({ ok: true, content: "kept" });
    expect(second.read("notes.txt")).toEqual({
      ok: false,
      reason: "resource-absent",
    });
    expect(() => ResourceMapStore.overlay(new Map([["./bad", "x"]]))).toThrow(
      TypeError,
    );
  });

  it("rejects every key that is not a canonical nonempty path", () => {
    const keys = [
      "",
      "./modules/m.hc",
      "/modules/m.hc",
      "modules//m.hc",
      "modules/./m.hc",
      "modules/../m.hc",
      "modules\\m.hc",
      "modules%2Fm.hc",
      "modules/%6D.hc",
    ];

    for (const key of keys) {
      const error = rejection(key);

      expect(error).toBeInstanceOf(TypeError);
      expect((error as TypeError).message).toEqual(
        `ResourceMapStore key must be a canonical nonempty path: ${
          JSON.stringify(key)
        }`,
      );
    }
  });
});
