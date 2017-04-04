import { Context, Frame, NilContext } from "../frames";

export class EvalPipe extends Frame {
  constructor(out: Frame, meta: Context = NilContext) {
    super(meta);
    this.set(Frame.kOUT, out);
  }

  public apply(expr: Frame, context: Frame) {
    const result = expr.in([context]);
    const out = this.get(Frame.kOUT);
    out.call(result);
    return result;
  }
}
