import { Frame, FrameList, Void } from "./frame";
import { FrameArg } from "./frame-arg";
import { FrameName } from "./frame-name";

export class FrameExpr extends FrameList {
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
      let value = item.in(context);
      if (value === Frame.missing) {
        value = item.in(this);
      }
      return sum.call(value);
    }, Frame.nil);
  }

  public call(context: Frame) {
    return this.in(context);
  };

  public toStringDataArray(): string[] {
    const array = super.toStringDataArray();
    return [array.join(" ")];
  }
};
