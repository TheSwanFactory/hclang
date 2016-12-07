import { Context, Frame, Void } from "./frame";

export class FrameLazy extends Frame {
  constructor(protected data: Frame, meta: Context = Void) {
    super(meta);
  }

  public in(context = Frame.nil) {
    return this.data;
  }

  public toString(): string {
    return this.toString();
  }
};
