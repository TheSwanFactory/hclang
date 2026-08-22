import { Frame, FrameArray, NilContext } from "../frames.ts";
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
 * import { evaluate } from "jsr:@swanfactory/hclang";
 *
 * const result = evaluate("1 + 1");
 * console.log(result.toStringArray()); // ["2"]
 */
export const evaluate = (input: string, meta = NilContext): FrameArray => {
  const out = new FrameArray([]);
  const hostNamespace = new Frame(meta);
  const hcEval = new HCEval(out, out, hostNamespace);
  hcEval.call(input);
  if (!hcEval.finish()) {
    out.apply(
      Frame.error(hcEval.error() ?? "incomplete lexical input"),
      Frame.nil,
    );
  }
  return out;
};
