import { type Context, EvaluationScope, Frame, NilContext } from "../frames.ts";

/** Live lexical lookup over every layer in one supplied evaluation scope. */
class ScopedLexicalContext extends Frame {
  public constructor(private readonly scope: EvaluationScope) {
    super();
  }

  public override get(key: string): Frame {
    const receiver = this.scope.receiverState?.receiver;
    for (const context of this.scope.lookupFrames()) {
      const value = context.get(key, receiver ?? context);
      if (!value.is.missing) return value;
    }
    return Frame.missing;
  }
}

/** Evaluates parsed groups against one source unit and emits to its output. */
export class EvalPipe extends Frame {
  private scope?: EvaluationScope;

  public static scoped(out: Frame, scope: EvaluationScope): EvalPipe {
    const pipe = new EvalPipe(out, scope.fileScope, scope.hostNamespace);
    pipe.scope = scope;
    pipe.set(Frame.kOUT, new ScopedLexicalContext(scope));
    return pipe;
  }

  constructor(
    public readonly out: Frame,
    public readonly fileScope: Frame = out,
    public readonly hostNamespace: Frame = Frame.nil,
    meta: Context = NilContext,
  ) {
    super(meta);
    // Legacy lexical features follow kOUT to the file scope. Scoped pipes
    // replace it with a live view of every supplied lookup layer.
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
