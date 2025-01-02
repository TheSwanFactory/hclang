import { Frame, FrameArray } from "../frames.ts";
import { HCEval } from "./hc-eval.ts";

export const evaluate = (input: string, ..._args: string[]): Frame => {
  const out = new FrameArray([]);
  const hc_eval = new HCEval(out);
  hc_eval.call(input);
  return out;
};
// https://stackoverflow.com/questions/63524054/typescript-optional-arguments-spreading-crashing-in-v4
