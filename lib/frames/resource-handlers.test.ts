import { expect } from "jsr:@std/expect@^0.219.1";
import { describe, it } from "jsr:@std/testing@^1.0.10/bdd";

import {
  characterElements,
  decomposeReference,
  type HandlerRead,
  type HandlerWrite,
  MemoryStore,
  ResourceHandlers,
  type SchemeHandler,
  StoreHandler,
} from "../frames.ts";

/** A handler that records what it was asked, and never touches a host. */
class RecordingHandler implements SchemeHandler {
  public reads: string[] = [];

  public constructor(private readonly label = "recording") {}

  public describe(): string {
    return this.label;
  }

  public read(reference: { path?: string }): HandlerRead {
    this.reads.push(reference.path ?? "");
    return { ok: true, elements: characterElements("ok") };
  }

  public write(): HandlerWrite {
    return { ok: false, reason: "handler-read-only" };
  }
}

describe("ResourceHandlers", () => {
  it("starts empty, so every scheme is an unbound slot", () => {
    expect(ResourceHandlers.none.schemes()).toEqual([]);
    expect(ResourceHandlers.none.handler("https")).toBeUndefined();
  });

  it("binds a scheme to one handler", () => {
    const handler = new RecordingHandler();
    const table = ResourceHandlers.of({ fixture: handler });

    expect(table.schemes()).toEqual(["fixture"]);
    expect(table.handler("fixture")).toBe(handler);
  });

  it("folds scheme case, as RFC 3986 requires", () => {
    const handler = new RecordingHandler();
    const table = ResourceHandlers.of({ HTTPS: handler });

    expect(table.schemes()).toEqual(["https"]);
    expect(table.handler("https")).toBe(handler);
    expect(table.handler("HtTpS")).toBe(handler);
  });

  it("enumerates its schemes, because the adapter surface is auditable", () => {
    const table = ResourceHandlers.of({
      https: new RecordingHandler(),
      clock: new RecordingHandler(),
    });

    expect(table.schemes()).toEqual(["clock", "https"]);
  });

  describe("nested composition is attenuation-only", () => {
    it("keeps only the schemes the parent already bound", () => {
      const parent = ResourceHandlers.of({
        clock: new RecordingHandler("clock"),
        fixture: new RecordingHandler("fixture"),
      });

      expect(parent.restrict(["clock"]).schemes()).toEqual(["clock"]);
      expect(parent.restrict(["clock"]).handler("fixture")).toBeUndefined();
    });

    it("cannot add a scheme the parent never had", () => {
      const parent = ResourceHandlers.of({ clock: new RecordingHandler() });
      const child = parent.restrict(["clock", "https", "file"]);

      expect(child.schemes()).toEqual(["clock"]);
      expect(child.handler("https")).toBeUndefined();
      expect(child.handler("file")).toBeUndefined();
    });

    it("cannot widen by restricting twice", () => {
      const parent = ResourceHandlers.of({
        clock: new RecordingHandler(),
        fixture: new RecordingHandler(),
      });
      const child = parent.restrict(["clock"]);

      expect(child.restrict(["clock", "fixture"]).schemes()).toEqual(["clock"]);
    });

    it("leaves the parent table unchanged", () => {
      const parent = ResourceHandlers.of({
        clock: new RecordingHandler(),
        fixture: new RecordingHandler(),
      });
      parent.restrict([]);

      expect(parent.schemes()).toEqual(["clock", "fixture"]);
    });
  });

  describe("installation is harness-only", () => {
    it("exposes no operation that installs into an existing table", () => {
      const table = ResourceHandlers.of({ clock: new RecordingHandler() });
      const operations = Object.getOwnPropertyNames(
        Object.getPrototypeOf(table),
      );

      // `restrict` is the only composition, and it removes rather than adds.
      expect(operations.sort()).toEqual([
        "constructor",
        "handler",
        "restrict",
        "schemes",
      ]);
    });

    it("is not a frame, so no HC value can carry one", () => {
      const table = ResourceHandlers.of({ clock: new RecordingHandler() });

      expect("set" in table).toBe(false);
      expect("apply" in table).toBe(false);
      expect("elements" in table).toBe(false);
    });
  });
});

describe("StoreHandler", () => {
  const parts = (reference: string) => decomposeReference(reference);

  it("adapts a store to one scheme", () => {
    const store = new MemoryStore("fixtures");
    const handler = new StoreHandler(store);

    expect(handler.describe()).toEqual("fixtures");
    expect(handler.write(parts("fixture:notes/a.txt"), "hi")).toEqual({
      ok: true,
      count: 2,
    });
    expect(store.read("notes/a.txt")).toEqual({ ok: true, content: "hi" });
  });

  it("reads characters, so a text-backed scheme composes like a path", () => {
    const store = new MemoryStore();
    const handler = new StoreHandler(store);
    handler.write(parts("fixture:a.txt"), "hi");

    const read = handler.read(parts("fixture:a.txt"));
    expect(read.ok).toBe(true);
    expect(read.ok && read.elements.map(String)).toEqual(["“h”", "“i”"]);
  });

  it("refuses what the path plane refuses, so a scheme is no way around it", () => {
    const handler = new StoreHandler(new MemoryStore());

    expect(handler.read(parts("fixture:../escape"))).toEqual({
      ok: false,
      reason: "resource-parent-escape",
    });
    expect(handler.read(parts("fixture://host/a"))).toEqual({
      ok: false,
      reason: "resource-authority-unbound",
    });
    expect(handler.read(parts("fixture:a?v=1"))).toEqual({
      ok: false,
      reason: "resource-part-unsupported",
    });
  });

  it("keeps a colon inside the path an ordinary character", () => {
    const store = new MemoryStore();
    const handler = new StoreHandler(store);

    expect(handler.write(parts("fixture:a:b.txt"), "x")).toEqual({
      ok: true,
      count: 1,
    });
    expect(store.read("a:b.txt")).toEqual({ ok: true, content: "x" });
  });

  it("reports an absent location rather than inventing one", () => {
    const handler = new StoreHandler(new MemoryStore());

    expect(handler.read(parts("fixture:missing.txt"))).toEqual({
      ok: false,
      reason: "resource-absent",
    });
  });
});
