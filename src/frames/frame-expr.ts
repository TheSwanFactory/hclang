import { Frame, FrameArray, Void } from "./frame";
import { FrameName } from "./frame-name";
import { FrameSymbol } from "./frame-symbol";

export class FrameExpr extends FrameArray {
  public static readonly BEGIN = "(";
  public static readonly END = ")";

  public static extract(key: string) {
    return new FrameExpr([
      FrameSymbol.here(),
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
    return FrameExpr.BEGIN + this.toStringData() + FrameExpr.END;
  }
};
