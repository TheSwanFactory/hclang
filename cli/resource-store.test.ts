import { expect } from "@std/expect";
import { describe, it } from "@std/testing/bdd";

import { DenoFileStore } from "./resource-store.ts";

/** A store and the resolved root it created, for direct host inspection. */
const opened = (): { store: DenoFileStore; root: string } => {
  const store = new DenoFileStore("hclang-test-");
  store.write("open.txt", "");
  return { store, root: store.describe() };
};

describe("DenoFileStore", () => {
  it("creates nothing until it is used", () => {
    const store = new DenoFileStore("hclang-test-");

    expect(store.describe()).toEqual("hclang-test-(uncreated)");
  });

  it("gives each instance its own root", () => {
    const first = opened();
    const second = opened();

    expect(first.root).not.toEqual(second.root);
    Deno.removeSync(first.root, { recursive: true });
    Deno.removeSync(second.root, { recursive: true });
  });

  it("round-trips content through the real filesystem", () => {
    const { store, root } = opened();

    expect(store.write("a.txt", "hello")).toEqual({
      ok: true,
      content: "hello",
    });
    expect(store.read("a.txt")).toEqual({ ok: true, content: "hello" });
    expect(Deno.readTextFileSync(`${root}/a.txt`)).toEqual("hello");

    Deno.removeSync(root, { recursive: true });
  });

  it("creates intermediate directories for a nested path", () => {
    const { store, root } = opened();

    store.write("a/b/c.txt", "deep");
    expect(store.read("a/b/c.txt")).toEqual({ ok: true, content: "deep" });

    Deno.removeSync(root, { recursive: true });
  });

  it("reports an absent location rather than inventing one", () => {
    const { store, root } = opened();

    expect(store.read("nope.txt")).toEqual({
      ok: false,
      reason: "resource-absent",
    });

    Deno.removeSync(root, { recursive: true });
  });

  it("refuses the root itself, which is not a file", () => {
    const { store, root } = opened();

    expect(store.read("")).toEqual({
      ok: false,
      reason: "resource-not-a-file",
    });
    expect(store.write("", "x")).toEqual({
      ok: false,
      reason: "resource-not-a-file",
    });

    Deno.removeSync(root, { recursive: true });
  });

  it("reports a file inside the root that the host will not read", () => {
    const { store, root } = opened();
    store.write("locked.txt", "secret");
    Deno.chmodSync(`${root}/locked.txt`, 0o000);
    expect(store.read("locked.txt")).toEqual({
      ok: false,
      reason: "resource-unreadable",
    });
    Deno.removeSync(root, { recursive: true });
  });

  it("reports a write under a path that is a file", () => {
    const { store, root } = opened();
    store.write("plain.txt", "flat");
    expect(store.write("plain.txt/inner.txt", "no")).toEqual({
      ok: false,
      reason: "resource-unwritable",
    });
    expect(Deno.readTextFileSync(`${root}/plain.txt`)).toEqual("flat");
    Deno.removeSync(root, { recursive: true });
  });

  it("keeps the created root as named when the host cannot resolve it", () => {
    const makeTempDirSync = Deno.makeTempDirSync;
    const realPathSync = Deno.realPathSync;
    let created = "";
    Deno.makeTempDirSync = (options?: Deno.MakeTempOptions) =>
      created = makeTempDirSync(options);
    Deno.realPathSync = () => {
      throw new Deno.errors.NotFound("unresolvable");
    };
    try {
      const store = new DenoFileStore("hclang-test-");
      expect(store.read("a.txt")).toEqual({
        ok: false,
        reason: "resource-absent",
      });
      expect(store.describe()).toEqual(created.replaceAll("\\", "/"));
    } finally {
      Deno.makeTempDirSync = makeTempDirSync;
      Deno.realPathSync = realPathSync;
      Deno.removeSync(created, { recursive: true });
    }
  });

  describe("containment re-verified after resolution", () => {
    it("refuses a symlinked file whose bytes come from outside", () => {
      const { store, root } = opened();
      const outside = Deno.makeTempDirSync({ prefix: "hclang-outside-" });
      Deno.writeTextFileSync(`${outside}/secret.txt`, "secret");
      Deno.symlinkSync(`${outside}/secret.txt`, `${root}/link.txt`);

      expect(store.read("link.txt")).toEqual({
        ok: false,
        reason: "resource-escaped-root",
      });
      expect(store.write("link.txt", "overwritten")).toEqual({
        ok: false,
        reason: "resource-escaped-root",
      });
      expect(Deno.readTextFileSync(`${outside}/secret.txt`)).toEqual("secret");

      Deno.removeSync(root, { recursive: true });
      Deno.removeSync(outside, { recursive: true });
    });

    it("refuses a symlinked directory before creating anything in it", () => {
      const { store, root } = opened();
      const outside = Deno.makeTempDirSync({ prefix: "hclang-outside-" });
      Deno.symlinkSync(outside, `${root}/escape`);

      expect(store.write("escape/deep/f.txt", "no")).toEqual({
        ok: false,
        reason: "resource-escaped-root",
      });
      expect([...Deno.readDirSync(outside)]).toEqual([]);

      Deno.removeSync(root, { recursive: true });
      Deno.removeSync(outside, { recursive: true });
    });

    it("accepts an ordinary path beside a refused one", () => {
      const { store, root } = opened();
      const outside = Deno.makeTempDirSync({ prefix: "hclang-outside-" });
      Deno.symlinkSync(outside, `${root}/escape`);

      expect(store.write("ordinary.txt", "yes")).toEqual({
        ok: true,
        content: "yes",
      });

      Deno.removeSync(root, { recursive: true });
      Deno.removeSync(outside, { recursive: true });
    });
  });
});
