import { Context, Frame, Void } from "./frame";
import { FrameArray } from "./frame-array";
import { FrameExpr } from "./frame-expr";

export class FrameLazy extends Frame {
  public static readonly LAZY_BEGIN = "{";
  public static readonly LAZY_END = "}";

  constructor(protected data: Frame, meta: Context = Void) {
    super(meta);
  }

  public in(context: Frame): Frame {
    if (context === Frame.nil) {
      return this;
    }
    const current = this.set(Frame.kUP, context);
    return this.data.set(Frame.kUP, current);
  }

  public call(argument: Frame): FrameExpr {
    return new FrameExpr([argument]);
  }

  public toString(): string {
    return FrameLazy.LAZY_BEGIN + " " + this.data.toString() + " " + FrameLazy.LAZY_END;
  }
};
