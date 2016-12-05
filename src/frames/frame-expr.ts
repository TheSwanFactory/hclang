import { Frame, FrameArray, Void } from "./frame";

export class FrameExpr extends FrameArray {
  public static readonly BEGIN = "(";
  public static readonly END = ")";

  constructor(data: Array<Frame>, meta = Void) {
    super(data, meta);
  }

  public in(context = Frame.nil) {
    return this.data.reduce((sum: Frame, item: Frame) => {
      const value = item.in(context);
      return sum.call(value);
    }, Frame.nil);
  }

  public toStringData() {
    return this.data.map((obj: Frame) => { return obj.toString(); }).join(" ");
  };

  public toString() {
    return FrameExpr.BEGIN + this.toStringData() + FrameExpr.END;
  }
};
