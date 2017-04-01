import { Frame, Void } from "./frame";
import { FrameList } from "./frame-list";

export class FrameGroup extends FrameList {
  constructor(data: Array<Frame>, meta = Void) {
    super(data, meta);
  }

  public in(contexts = [Frame.nil]): Frame {
    if (this.size() > 1) {
      return this.array_eval(contexts);
    }
    const expr = this.data[0];
    contexts.push(this);
    return expr.in(contexts);
  }
}
