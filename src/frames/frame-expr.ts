import { Frame, FrameArray, Void } from "./frame";
import { FrameArg } from "./frame-arg";
import { FrameName } from "./frame-name";

export class FrameExpr extends FrameArray {
  public static readonly EXPR_BEGIN = "(";
  public static readonly EXPR_END = ")";

  public static extract(key: string) {
    return new FrameExpr([
      FrameArg.here(),
      new FrameName(key),
    ]);
  }

  constructor(data: Array<Frame>, meta = Void) {
    super(data, meta);
  }

  public in(context = Frame.nil) {
    return this.data.reduce((sum: Frame, item: Frame) => {
      const value = item.in(context);
      return sum.call(value);
    }, Frame.nil);
  }

  public call(context: Frame) {
    return this.in(context);
  };

  public toStringData() {
    return this.data.map((obj: Frame) => { return obj.toString(); }).join(" ");
  };

  public toString() {
    return FrameExpr.EXPR_BEGIN + this.toStringData() + FrameExpr.EXPR_END;
  }
};
