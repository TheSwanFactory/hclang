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

  public in(contexts = [Frame.nil]) {
    contexts.push(this);
    return this.data.reduce((sum: Frame, item: Frame) => {
      let value = item.in(contexts);
      return sum.call(value);
    }, Frame.nil);
  }

  public call(context: Frame) {
    return this.in([context]);
  };

  public toStringDataArray(): string[] {
    const array = super.toStringDataArray();
    return [array.join(" ")];
  }
};
