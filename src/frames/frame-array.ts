import { Frame, NilContext } from "./frame";
import { FrameList } from "./frame-list";

export interface IArrayConstructor {
    new (data: Array<Frame>): FrameArray;
}

export class FrameArray extends FrameList {
  public static readonly BEGIN_ARRAY = "[";
  public static readonly END_ARRAY = "]";

  constructor(data: Array<Frame>, meta = NilContext) {
    super(data, meta);
  }

  public string_open() { return FrameArray.BEGIN_ARRAY; };
  public string_close() { return FrameArray.END_ARRAY; };

  public in(contexts = [Frame.nil]): Frame {
    return this.array_eval(contexts);
  }

  public apply(argument: Frame, parameter: Frame) {
    if (!argument.isVoid()) {
      this.data.push(argument);
    }
    return this;
  }

  public at(index: number) {
    if (index >= this.size()) {
      return Frame.missing;
    }
    return this.data[index];
  }

  public reset() {
    this.data = [];
  }
}
