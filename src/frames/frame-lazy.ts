import { Context, Frame, IKeyValuePair, Void } from "./frame";
import { FrameExpr } from "./frame-expr";

export class FrameLazy extends FrameExpr {
  public static readonly LAZY_BEGIN = "{";
  public static readonly LAZY_END = "}";

  constructor(data: Array<Frame>, meta: Context = Void) {
    super(data, meta);
  }

  public string_open() { return FrameLazy.LAZY_BEGIN + " "; };
  public string_close() { return  " " + FrameLazy.LAZY_END; };

  public in(contexts = [Frame.nil]): Frame {
    if (this.data.length === 0) {
      return this;
    }
    return new FrameExpr(this.data, this.meta_for(contexts[0]));
  }

  public call(argument: Frame): FrameExpr {
    return new FrameExpr(argument.asArray(), this.meta_for(argument));
  }

  protected meta_for(context: Frame) {
    let MetaNew = this.meta_copy();
    let pairs: Array<IKeyValuePair> = context.meta_pairs();
    pairs.map(([key, value]) => { MetaNew[key] = value; });
    return MetaNew;
  }
};
