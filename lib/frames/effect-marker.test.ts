import { expect } from "jsr:@std/expect@^0.219.1";
import { describe, it } from "jsr:@std/testing@^1.0.10/bdd";

import {
  EFFECT_MARKER,
  methodEffect,
  touchesIdentity,
} from "./effect-marker.ts";

describe("touchesIdentity", () => {
  it("marks a key that ends with the marker", () => {
    for (const key of ["set_", "set-count_", "_shared_", "__secret_", "A_"]) {
      expect(touchesIdentity(key)).toBe(true);
    }
  });

  it("leaves an unmarked key alone", () => {
    for (const key of ["set", "_shared", "__secret", "set_count", ""]) {
      expect(touchesIdentity(key)).toBe(false);
    }
  });

  it("does not mark a key that is only markers", () => {
    // `_`, `__`, and longer runs are FrameArg's argument and enclosing scopes.
    // A marker with nothing before it marks nothing.
    for (const key of ["_", "__", "___"]) {
      expect(touchesIdentity(key)).toBe(false);
    }
  });

  it("reads the marker rather than a hard-coded underscore", () => {
    expect(`name${EFFECT_MARKER}`).toEqual("name_");
  });
});

describe("methodEffect", () => {
  it("declares a marked key mutating and names it without its marker", () => {
    expect(methodEffect("set_")).toEqual({ name: "set", mutating: true });
    expect(methodEffect("set-count_")).toEqual({
      name: "set-count",
      mutating: true,
    });
  });

  it("keeps a leading-underscore visibility marker in the name", () => {
    // Leading underscores are the visibility axis, graded by `resolve_here`.
    // Only the trailing marker belongs to the effect axis.
    expect(methodEffect("__secret_")).toEqual({
      name: "__secret",
      mutating: true,
    });
    expect(methodEffect("_shared_")).toEqual({
      name: "_shared",
      mutating: true,
    });
  });

  it("declares an unmarked key non-mutating under its own name", () => {
    expect(methodEffect("get")).toEqual({ name: "get", mutating: false });
    expect(methodEffect("__secret")).toEqual({
      name: "__secret",
      mutating: false,
    });
  });

  it("never yields a mutating effect without a subject to name", () => {
    // `$!.copy-on-write-boundary .${name}` is the one reader of `name`, so a
    // mutating effect with an empty name would print a bare dot.
    for (const key of ["", "_", "__", "___"]) {
      const effect = methodEffect(key);
      expect(effect.mutating).toBe(false);
      expect(effect.name).toEqual(key);
    }
  });
});
