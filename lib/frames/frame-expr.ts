import { Frame } from "./frame.ts";
import { FrameList } from "./frame-list.ts";
import { NilContext } from "./context.ts";

export class FrameExpr extends FrameList {
  constructor(data: Array<Frame>, meta = NilContext) {
    super(data, meta);
    data.forEach((item) => {
      item.up = this;
    });
  }

  public override in(contexts = [Frame.nil]): Frame {
    contexts.push(this);
    const result = this.data.reduce((sum: Frame, item: Frame, index): Frame => {
      const value = item.in(contexts);
      if (index > 0 && value.is.operator === true) {
        return value.called_by(sum, Frame.nil);
      }
      const next_sum = sum.call(value);
      return next_sum;
    }, Frame.nil);

    if (this.is.statement) {
      const statement = new FrameExpr([result]);
      statement.is.statement = true;
      statement.is.error = result.is.error === true;
      return statement;
    }
    return result;
  }

  public override call(argument: Frame, parameter = Frame.nil): Frame {
    return this.in([argument, parameter]);
  }

  public override toStringDataArray(): string[] {
    const body = this.data.map((obj: Frame) => obj.toString()).join(" ");
    // Don't add separator here - let parent FrameList handle it
    return [body];
  }
}

export class FrameBind extends FrameExpr {
}
