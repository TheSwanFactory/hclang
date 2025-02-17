import { type Context, Frame, NilContext } from "../frames.ts";

export class EvalPipe extends Frame {
  constructor(out: Frame, meta: Context = NilContext) {
    super(meta);
    this.set(Frame.kOUT, out);
    this.up = out;
  }

  public override apply(expr: Frame, context: Frame): Frame {
    const out = this.get(Frame.kOUT);
    const result = expr.in([out, context]);
    out.apply(result, context);
    return result;
  }
}
