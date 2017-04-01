import { Frame, Void } from "./frame";
import { FrameList } from "./frame-list";

export class FrameGroup extends FrameList {
  constructor(data: Array<Frame>, meta = Void) {
    super(data, meta);
  }

  public in(contexts = [Frame.nil]): Frame {
    return this.array_eval(contexts);
  }
}
