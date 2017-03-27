import { Frame, FrameList, Void } from "./frame";

export class FrameArray extends FrameList {
  public static readonly BEGIN_ARRAY = "[";
  public static readonly END_ARRAY = "]";

  constructor(data: Array<Frame>, meta = Void) {
    super(data, meta);
  }

  public string_open() { return FrameArray.BEGIN_ARRAY; };
  public string_close() { return FrameArray.END_ARRAY; };

  public in(contexts = [Frame.nil]): Frame {
    contexts.push(this);
    return new FrameArray(this.data.map( (f: Frame) => f.in(contexts) ));
  }

  public apply(argument: Frame, parameter: Frame) {
    this.data.push(argument);
    return this;
  }

  public size() {
    return this.data.length;
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
