import { Frame } from "./frame.ts";
import { FrameExpr } from "./frame-expr.ts";
import { Context, IKeyValuePair, NilContext } from "./meta-frame.ts";

export class FrameLazy extends FrameExpr {
  public static readonly LAZY_BEGIN = "{";
  public static readonly LAZY_END = "}";

  constructor(data: Array<Frame>, meta: Context = NilContext) {
    super(data, meta);
  }

  public override string_open() {
    return FrameLazy.LAZY_BEGIN;
  }

  public override string_close() {
    return FrameLazy.LAZY_END;
  }

  public override in(contexts = [Frame.nil]): Frame {
    if (this.data.length === 0) {
      return this;
    }
    const expr = new FrameExpr(this.data, this.meta_for(contexts[0]));
    expr.up = this;
    return expr;
  }

  public override call(argument: Frame, _parameter = Frame.nil): FrameExpr {
    return new FrameExpr(argument.asArray(), this.meta_for(argument));
  }

  protected meta_for(context: Frame) {
    const MetaNew = this.meta_copy();
    const pairs: Array<IKeyValuePair> = context.meta_pairs();
    pairs.forEach(([key, value]) => {
      MetaNew[key] = value;
    });
    return MetaNew;
  }
}
