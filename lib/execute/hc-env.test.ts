import { expect } from "jsr:@std/expect";
import * as frame from "../frames.ts";
import { HCEval, make_context } from "./hc-eval.ts";

const key = "key";
const value = "value";
const frame_value = new frame.FrameString(value);

Deno.test({
  name: "evaluates in env",
  fn(): void {
    const env = { key: value };
    const context = make_context(env);
    const out2 = new frame.FrameArray([], context);
    const hc_eval2 = new HCEval(out2);
    hc_eval2.call(key);
    expect(out2.length()).toEqual(1);
    const output = out2.at(0);
    expect(output.toString()).toEqual(frame_value.toString());
  },
});
