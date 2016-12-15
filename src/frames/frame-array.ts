import { Frame, Void } from "./frame";

export class FrameArray extends Frame {
  public static readonly BEGIN_ARRAY = "[";
  public static readonly END_ARRAY = "]";

  constructor(public data: Array<Frame>, meta = Void) {
    super(meta);
  }

  public group_begin() { return FrameArray.BEGIN_ARRAY; };
  public group_end() { return FrameArray.END_ARRAY; };

  public in(context = Frame.nil): Frame {
    return new FrameArray(this.data.map((f) => { return f.in(context); }));
  }

  public at(index: number) {
    return this.data[index];
  }

  public toStringData() {
    return this.data.map((obj: Frame) => { return obj.toString(); }).join(", ");
  };
}
