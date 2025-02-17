import { FrameArray, NilContext } from "../frames.ts";
import { HCEval } from "./hc-eval.ts";

/**
 * Evaluates the given input string within the provided context and returns the result as a FrameArray.
 *
 * @param {string} input - The input string to be evaluated.
 * @param {NilContext} [meta=NilContext] - The context in which the evaluation takes place. Defaults to NilContext.
 * @returns {FrameArray} The result of the evaluation as a FrameArray.
 * 
 * @example
 * import { evaluate } from "jsr:@swanfactory/hclang";
 *
 * const input = '1 + 1';
 * const result = evaluate(input);
 * const array = result.toStringArray();
 * console.log(array); // Output: ['2']
 */
export const evaluate = (input: string, meta = NilContext): FrameArray => {
  const out = new FrameArray([], meta);
  const hc_eval = new HCEval(out);
  hc_eval.call(input);
  return out;
};
