import { Frame, FrameArray } from "./frame";

export class FrameExpr extends FrameArray {
  public static readonly BEGIN = "(";
  public static readonly END = ")";

  constructor(data: Array<Frame>) {
    super(data);
  }

  public call(argument: Frame) {
    return this.data.reduce((sum: Frame, val: Frame) => { return sum.call(val); }, Frame.nil);
  }

  public toStringData() {
    return this.data.map((obj: Frame) => { return obj.toString(); }).join(" ");
  };

  public toString() {
    return FrameExpr.BEGIN + this.toStringData() + FrameExpr.END;
  }
};
