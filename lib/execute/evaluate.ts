import { type Context, Frame, FrameArray, NilContext } from "../frames.ts";
import { HCEval } from "./hc-eval.ts";

/**
 * Evaluates the given input string with an optional host namespace.
 *
 * Host bindings are reached explicitly through `$$`, while declarations and
 * bare-name lookup belong to the returned file-scope array.
 *
 * @param input The HC source to evaluate.
 * @param meta Host-supplied bindings, exposed through `$$`.
 * @returns The source unit's results and top-level declarations.
 *
 * @example
 * ```ts
 * import { evaluate } from "jsr:@swanfactory/hclang";
 *
 * const result = evaluate("1 + 1");
 * console.log(result.toStringArray()); // ["2"]
 * ```
 */
export function evaluate(
  input: string,
  meta: Context = NilContext,
): FrameArray {
  const out = new FrameArray([]);
  evaluateInto(input, out, out, new Frame(meta));
  return out;
}

/**
 * Evaluates one complete source unit into `out`. An incomplete finish, such as
 * an unclosed group, is collected into `out` as an error.
 *
 * @param input The HC source to evaluate.
 * @param out Where the results are collected.
 * @param fileScope The source unit's declarations.
 * @param hostNamespace Host-supplied bindings, exposed through `$$`.
 */
export function evaluateInto(
  input: string,
  out: FrameArray,
  fileScope: Frame,
  hostNamespace: Frame,
): void {
  const evaluator = new HCEval(out, fileScope, hostNamespace);
  evaluator.call(input);
  if (!evaluator.finish()) {
    out.collect(Frame.error(evaluator.incompleteReason()), Frame.nil);
  }
}
