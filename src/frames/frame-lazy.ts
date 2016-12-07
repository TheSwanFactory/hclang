import { Context, Frame, Void } from "./frame";

export class FrameLazy extends Frame {
  constructor(protected data: Frame, meta: Context = Void) {
    super(meta);
  }
  public toString(): string {
    return this.toString();
  }
};
