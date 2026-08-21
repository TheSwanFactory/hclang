import { expect } from "jsr:@std/expect@^0.219.1";
import { describe, it } from "jsr:@std/testing@^1.0.10/bdd";

import {
  Frame,
  FrameAlias,
  FrameArray,
  FrameExpr,
  FrameLazy,
  FrameString,
  FrameSymbol,
} from "../frames.ts";
import { BoundMethod } from "./bound-method.ts";
import { methodEffect } from "./effect-marker.ts";

describe("FrameAlias", () => {
  const key = "atom";
  const frame_alias = new FrameAlias(key);
  const value_1 = new FrameString("neutron");
  const value_2 = new FrameString("proton");
  const parent = new FrameString("parent", { atom: value_1 });
  const child = new FrameString("child");
  child.up = parent;

  it("is created from a string", () => {
    expect(frame_alias).toBeInstanceOf(FrameAlias);
  });

  it("stringifies with @ prefix", () => {
    expect(frame_alias.toString()).toEqual(`@${key}`);
  });

  it("evaluates to a setter for ancestor", () => {
    const frame_key = FrameSymbol.for(key);
    const result = frame_alias.in([child]);
    expect(result.toString()).toContain(frame_key.toString());
    const out = result.get(FrameAlias.kOUT);
    expect(out).toEqual(parent);
  });

  it("sets properties in ancestor", () => {
    const result_1 = child.get(key);
    expect(result_1.toString()).toContain("neutron");

    const frame_expr = new FrameExpr([frame_alias, value_2]);
    frame_expr.in([child]);

    const result_2 = child.get(key);
    expect(result_2.toString()).toContain("proton");
    const result_3 = parent.get(key);
    expect(result_3.toString()).toContain("proton");
  });

  it("writes through a logical protected name to its declaration", () => {
    const owner = new Frame({ _protected: value_1 });
    const lexical = new Frame({ _protected: new FrameString("lexical") });
    const descendant = new Frame();
    descendant.setParent(owner);
    descendant.up = lexical;

    new FrameExpr([new FrameAlias("protected"), value_2]).in([descendant]);

    expect(owner.get_here("_protected")).toBe(value_2);
    expect(lexical.get_here("_protected").toString()).toEqual("“lexical”");
    expect(descendant.get_here("_protected").is.missing).toBe(true);
    expect(owner.meta.protected).toBeUndefined();
  });

  it("denies inherited private writes without creating a shadow", () => {
    const owner = new Frame({ __private: value_1 });
    const descendant = new Frame();
    descendant.setParent(owner);
    const result = new FrameExpr([
      new FrameAlias("private"),
      value_2,
    ]).in([descendant]);

    expect(result.toString()).toEqual("$!.is-private .private");
    expect(owner.get_here("__private")).toBe(value_1);
    expect(descendant.meta.private).toBeUndefined();
  });

  it("gates receiver-owned aliases before lexical fallback", () => {
    const lexical = new Frame({ atom: value_1 });
    const receiver = new FrameArray([], { atom: value_1 });
    receiver.up = lexical;
    const method = new FrameLazy([frame_alias, value_2]);

    const result = new BoundMethod(
      method,
      receiver,
      true,
      methodEffect("write"),
    ).call(
      Frame.nil,
    );

    expect(result.toString()).toEqual("$!.method-not-mutating @atom");
    expect(receiver.get_here("atom")).toBe(value_1);
    expect(lexical.get_here("atom")).toBe(value_1);
  });

  it("writes lexical scope after a receiver miss, never the argument", () => {
    const lexical = new Frame({ atom: value_1 });
    const receiver = new FrameArray([]);
    receiver.up = lexical;
    const argument = new Frame({ atom: new FrameString("argument") });
    const method = new FrameLazy([frame_alias, value_2]);

    new BoundMethod(method, receiver, true, methodEffect("write")).call(
      argument,
    );

    expect(lexical.get_here("atom")).toBe(value_2);
    expect(argument.get_here("atom").toString()).toEqual("“argument”");
  });

  it("does not treat an argument-only binding as an alias target", () => {
    const receiver = new FrameArray([]);
    const argument = new Frame({ atom: value_1 });
    const method = new FrameLazy([frame_alias, value_2]);

    const result = new BoundMethod(
      method,
      receiver,
      true,
      methodEffect("write"),
    ).call(
      argument,
    );

    expect(result.toString()).toContain("$!.name-missing");
    expect(argument.get_here("atom")).toBe(value_1);
  });

  it("terminates a cyclic lexical search as missing", () => {
    const left = new Frame();
    const right = new Frame();
    left.up = right;
    right.up = left;

    const result = new FrameAlias("absent").in([left]);

    expect(result.toString()).toContain("$!.name-missing");
  });
});
