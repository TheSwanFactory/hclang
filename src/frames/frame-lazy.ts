import { Context, Frame, Void } from "./frame";

export class FrameLazy extends Frame {
  public static readonly BEGIN_LAZY = "{";
  public static readonly END_LAZY = "}";

  constructor(protected data: Frame, meta: Context = Void) {
    super(meta);
  }

  public in(context: Frame): Frame {
    const current = this.set(Frame.kUP, context);
    return this.data.set(Frame.kUP, current);
  }

  public toString(): string {
    return FrameLazy.BEGIN_LAZY + " " + this.data.toString() + " " + FrameLazy.END_LAZY;
  }
};
