import { assert } from "jsr:@std/assert@1";
import * as frame from "../../src/frames.ts";
import { HCEval } from "../../src/execute/hc-eval.ts";

const key = "key";
const value = "value";
const frame_value = new frame.FrameString(value);

const MockEnv: Deno.Env = {
  get: (_k: string) => {
    return value;
  },
  has: (k: string) => {
    return k == key;
  },
  set: (k: string, value: string) => {
    console.log(`Set ${k} = ${value}`);
  },
  delete: (k: string) => {
    console.log(`Deleted ${k}`);
  },
  toObject: () => {
    return { key: value };
  },
};

Deno.test({
  name: "evaluates in env",
  fn() {
    const env = MockEnv;
    env.set(key, value);
    const context = HCEval.make_context(env);
    const out2 = new frame.FrameArray([], context);
    const hc_eval2 = new HCEval(out2);
    hc_eval2.call(key);
    assert(out2.length() === 1);
    const output = out2.at(0);
    assert(output.toString() === frame_value.toString());
  },
});
