import { evaluate } from "./evaluate.ts";
import type { FrameArray } from "../frames.ts";
import { NilContext } from "../frames.ts";

const stripLastCommas = (array: Array<string>) => {
  const result = array.map((item) => {
    const n = item.length - 1;
    if (item[n] === ",") {
      return item.substring(0, n);
    }
    return item;
  });
  return result;
};

/**
 * Executes the given input string and returns the processed result as a string.
 * It is a wrapper around the `evaluate` function.
 *
 * @param {string} input - The input string of `hc` code to be evaluated.
 * @returns {string} - The processed result(s) as a string, with each element separated by a newline.
 *
 * @example
 * import { execute } from "jsr:@swanfactory/hclang";
 *
 * const input = '1 + 1';
 * const result = execute(input);
 * console.log(result); // Output: '2'
 */
export const execute = (input: string, meta = NilContext): string => {
  const result = evaluate(input, meta) as FrameArray;
  const array = result.toStringArray();
  const stripped = stripLastCommas(array);
  return stripped.join("\n");
};
