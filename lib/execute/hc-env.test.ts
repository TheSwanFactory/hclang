import { expect } from "jsr:@std/expect@^0.219.1";
import * as frame from "../frames.ts";
import { HCEval, make_context } from "./hc-eval.ts";

Deno.test({
  name: "exposes host values only through the host anchor",
  fn(): void {
    const context = make_context({ key: "value" });
    const host = new frame.Frame(context);
    const explicitOut = new frame.FrameArray([]);
    const explicit = new HCEval(explicitOut, explicitOut, host);

    explicit.call("$$.key");

    expect(explicitOut.length()).toEqual(1);
    expect(explicitOut.at(0).toString()).toEqual("“value”");

    const bareOut = new frame.FrameArray([]);
    const bare = new HCEval(bareOut, bareOut, host);
    bare.call("key");

    expect(bareOut.at(0).toString()).toContain("$!.name-missing");
  },
});
