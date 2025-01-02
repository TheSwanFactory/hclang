import { expect } from "chai";
import { describe, it } from "jsr:@std/testing/bdd";

import {
  FrameAlias,
  FrameExpr,
  FrameString,
  FrameSymbol,
} from "../../src/frames.ts";

describe("FrameAlias", () => {
  const key = "atom";
  const frame_alias = new FrameAlias(key);
  const value_1 = new FrameString("neutron");
  const value_2 = new FrameString("proton");
  const parent = new FrameString("parent", { atom: value_1 });
  const child = new FrameString("child");
  child.up = parent;

  it("is created from a string", () => {
    expect(frame_alias).to.be.instanceOf(FrameAlias);
  });

  it("stringifies with @ prefix", () => {
    expect(frame_alias.toString()).to.equal(`@${key}`);
  });

  it("evaluates to a setter for ancestor", () => {
    const frame_key = FrameSymbol.for(key);
    const result = frame_alias.in([child]);
    expect(result.toString()).to.include(frame_key.toString());
    const out = result.get(FrameAlias.kOUT);
    expect(out).to.equal(parent);
  });

  it("sets properties in ancestor", () => {
    const result_1 = child.get(key);
    expect(result_1.toString()).to.include("neutron");

    const frame_expr = new FrameExpr([frame_alias, value_2]);
    frame_expr.in([child]);

    const result_2 = child.get(key);
    expect(result_2.toString()).to.include("proton");
    const result_3 = parent.get(key);
    expect(result_3.toString()).to.include("proton");
  });
});
