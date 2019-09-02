import { Frame } from "./frame";
import { FrameList } from "./frame-list";
import { NilContext } from "./meta-frame";

export class FrameExpr extends FrameList {
  constructor(data: Array<Frame>, meta = NilContext) {
    super(data, meta);
    data.forEach((item) => { item.up = this; });
  }

  public in(contexts = [Frame.nil]) {
    contexts.push(this);
    const result = this.data.reduce((sum: Frame, item: Frame) => {
      const value = item.in(contexts);
      const next_sum = sum.call(value)
      return next_sum;
    }, Frame.nil);
    return result;
  }

  public call(argument: Frame, parameter = Frame.nil) {
    return this.in([argument, parameter]);
  };

  public toStringDataArray(): string[] {
    const array = super.toStringDataArray();
    return [array.join(" ")];
  }
};
