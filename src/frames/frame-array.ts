import { Frame, Void } from "./frame";

export class FrameArray extends Frame {
  constructor(public data: Array<Frame>, meta = Void) {
    super(meta);
  }

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
