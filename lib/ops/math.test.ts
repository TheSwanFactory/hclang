import { expect } from "@std/expect";
import { describe, it } from "@std/testing/bdd";
import { FrameArray, FrameCount, FrameInt } from "../frames.ts";
import { Divide } from "./math.ts";
/**
 * List division before the evaluator installs its carrier (#524). Only
 * `lib/execute/router-prologue.ts` installs it, and this file imports no
 * evaluator; each test file runs in its own isolate, so no other file's
 * import reaches it.
 */
describe("list division without a carrier", () => {
  it("refuses a dealt division as the router being unavailable", () => {
    const list = new FrameArray([FrameInt.for("1"), FrameInt.for("2")]);
    expect(Divide(list, new FrameCount(2n)).toString())
      .toEqual("$!.router-unavailable /");
  });
});
