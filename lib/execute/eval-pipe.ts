import { type Context, EvaluationScope, Frame, NilContext } from "../frames.ts";

/** Evaluates parsed groups against one source unit and emits to its output. */
export class EvalPipe extends Frame {
  private scope?: EvaluationScope;

  public static scoped(out: Frame, scope: EvaluationScope): EvalPipe {
    const pipe = new EvalPipe(out, scope.fileScope, scope.hostNamespace);
    pipe.scope = scope;
    return pipe;
  }

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
    const scope = this.scope ??
      EvaluationScope.root(this.fileScope, this.hostNamespace);
    const result = expr.in(scope);
    this.out.collect(result, context);
    return result;
  }
}
