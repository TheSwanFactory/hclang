import { expect } from "jsr:@std/expect@^0.219.1";
import { describe, it } from "jsr:@std/testing@^1.0.10/bdd";

import { FrameAlias, FrameExpr, FrameString, FrameSymbol } from "../frames.ts";

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
});
