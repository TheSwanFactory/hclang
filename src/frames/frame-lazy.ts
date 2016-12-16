import { Context, Frame, FrameList, Void } from "./frame";
import { FrameExpr } from "./frame-expr";

export class FrameLazy extends FrameList {
  public static readonly LAZY_BEGIN = "{";
  public static readonly LAZY_END = "}";

  constructor(data: Array<Frame>, meta: Context = Void) {
    super(data, meta);
  }

  public string_open() { return FrameLazy.LAZY_BEGIN + " "; };
  public string_close() { return  " " + FrameLazy.LAZY_END; };

  public in(context: Frame): Frame {
    if (this.data.length === 0) {
      return this;
    }
    const current = this.set(Frame.kUP, context);
    return new FrameExpr(this.data, {up: current});
  }

  public call(argument: Frame): FrameExpr {
    return new FrameExpr(argument.toArray(), {up: this});
  }
};
