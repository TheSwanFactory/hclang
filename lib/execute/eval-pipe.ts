import { type Context, EvaluationScope, Frame, NilContext } from "../frames.ts";

/** Evaluates parsed groups against one source unit and emits to its output. */
export class EvalPipe extends Frame {
  constructor(
    public readonly out: Frame,
    public readonly fileScope: Frame = out,
    public readonly hostNamespace: Frame = Frame.nil,
    meta: Context = NilContext,
  ) {
    super(meta);
    // Lexical features that consult the live source context follow kOUT to the
    // file scope, while evaluated results use the separate output capability.
    this.set(Frame.kOUT, fileScope);
    this.up = out;
  }

  public override apply(expr: Frame, context: Frame): Frame {
    const result = expr.in(
      EvaluationScope.root(this.fileScope, this.hostNamespace),
    );
    this.out.apply(result, context);
    return result;
  }
}
