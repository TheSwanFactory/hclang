import { Frame } from "./frame";
import { FrameExpr } from "./frame-expr";
import { Context, NilContext } from "./meta-frame";

export class FrameGroup extends FrameExpr {
  constructor(data: Array<Frame>, meta = NilContext) {
    super(data, meta);
  }

  public eval_one(contexts = [Frame.nil]): Frame {
    contexts.push(this);
    const expr = this.data[0];
    const result = expr.in(contexts);
    if (expr.is.statement) {
      result.is.statement = true;
    }

    const symbols = this.meta_pairs();
    symbols.map(([key, value]) => {
      result.set(key, value);
    });
    return result;
  }

  public in(contexts = [Frame.nil]): Frame {
    switch (this.size()) {
      case 0: {
        return Frame.nil;
      }
      case 1: {
        return this.eval_one(contexts);
      }
    }
    this.data = this.data.map( (f: Frame) => f.in(contexts) );
    return this;
  }
}
