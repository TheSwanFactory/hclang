import { Context, Frame, FrameArray, FrameSymbol, Void } from "../frames";

export class ParseToken extends Frame {
  constructor(protected data: Frame, meta: Context = Void) {
    super(meta);
  }

  public called_by(context: Frame, parameter: Frame) {
    return context.apply(this.data, parameter);
  }
}

export class ParsePipe extends FrameArray {
  constructor(out: Frame, meta: Context = Void) {
    let data: Array<Frame> = [];
    meta[Frame.kOUT] = out;
    super(data, meta);
  }
}
