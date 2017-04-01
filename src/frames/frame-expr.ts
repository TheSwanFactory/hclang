import { Frame, Void } from "./frame";
import { FrameComment } from "./frame-comment";
import { FrameList } from "./frame-list";

export class FrameExpr extends FrameList {
  constructor(data: Array<Frame>, meta = Void) {
    super(data, meta);
    data.forEach((item) => { item.up = this; });
  }

  public in(contexts = [Frame.nil]) {
    contexts.push(this);
    return this.data.reduce((sum: Frame, item: Frame) => {
      let value = item.in(contexts);
      if (value instanceof FrameComment) {
        return sum;
      }
      return sum.call(value);
    }, Frame.nil);
  }

  public call(argument: Frame, parameter = Frame.nil) {
    return this.in([argument, parameter]);
  };

  public toStringDataArray(): string[] {
    const array = super.toStringDataArray();
    return [array.join(" ")];
  }
};
