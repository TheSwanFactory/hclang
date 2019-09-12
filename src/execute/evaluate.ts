import { Frame, FrameArray, NilContext } from "../frames";
import { HCEval } from "./hc-eval";

export const evaluate = (input: string): Frame => {
  const out = new FrameArray([]);
  const hc_eval = new HCEval(out);
  hc_eval.call(input);
  return out;
};
