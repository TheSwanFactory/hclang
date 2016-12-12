import { Context, Frame, Void } from "./frame";

export class FrameLazy extends Frame {
  public static readonly LAZY_BEGIN = "{";
  public static readonly LAZY_END = "}";

  constructor(protected data: Frame, meta: Context = Void) {
    super(meta);
  }

  public in(context: Frame): Frame {
    if (context === Frame.nil) {
      return this;
    }
    const current = this.set(Frame.kUP, context);
    return this.data.set(Frame.kUP, current);
  }

  public toString(): string {
    return FrameLazy.LAZY_BEGIN + " " + this.data.toString() + " " + FrameLazy.LAZY_END;
  }
};
