import { type Context, Frame, NilContext } from "../frames.ts";

/**
 * The `EvalPipe` class extends `Frame` and is used to evaluate frames within a given context.
 * It is typically called by `ParsePipe` to evaluate expressions in the output context.
 *
 * @extends Frame
 */
export class EvalPipe extends Frame {
  /**
   * Creates an instance of EvalPipe.
   * @param {Frame} out - The output frame.
   * @param {Context} [meta=NilContext] - The context metadata.
   */
  constructor(out: Frame, meta: Context = NilContext) {
    super(meta);
    this.set(Frame.kOUT, out);
    this.up = out;
  }

  /**
   * Applies the given expression within the provided context.
   * @param {Frame} expr - The expression frame to apply.
   * @param {Frame} context - The context frame.
   * @returns {Frame} - Returns the result of the applied expression.
   */
  public override apply(expr: Frame, context: Frame): Frame {
    const out = this.get(Frame.kOUT);
    const result = expr.in([out, context]);
    out.apply(result, context);
    return result;
  }
}
