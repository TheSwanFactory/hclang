import { expect } from "npm:chai";
import * as frame from "../../lib/frames.ts";
import { HCEval, make_context } from "../../lib/execute/hc-eval.ts";

const key = "key";
const value = "value";
const frame_value = new frame.FrameString(value);

Deno.test({
  name: "evaluates in env",
  fn() {
    const env = { key: value };
    const context = make_context(env);
    const out2 = new frame.FrameArray([], context);
    const hc_eval2 = new HCEval(out2);
    hc_eval2.call(key);
    expect(out2.length()).to.equal(1);
    const output = out2.at(0);
    expect(output.toString()).to.equal(frame_value.toString());
  },
});
