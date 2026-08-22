import { evaluate } from "./evaluate.ts";
import { type FrameArray, NilContext } from "../frames.ts";

const stripLastCommas = (array: string[]): string[] =>
  array.map((item) => {
    const last = item.length - 1;
    return item[last] === "," ? item.substring(0, last) : item;
  });

/** Renders evaluator output using the public `execute` line convention. */
export const renderResults = (result: FrameArray): string =>
  stripLastCommas(result.toStringArray()).join("\n");

/**
 * Evaluates HC source and renders each result on its own line.
 *
 * @param input HC source for one file/module scope.
 * @param meta Host-supplied bindings, reachable only through `$$`.
 * @returns Rendered evaluation results separated by newlines.
 *
 * @example
 * import { execute } from "jsr:@swanfactory/hclang";
 *
 * console.log(execute("1 + 1")); // "2"
 */
export const execute = (input: string, meta = NilContext): string =>
  renderResults(evaluate(input, meta));
