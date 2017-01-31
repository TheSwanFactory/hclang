import { Context, Frame, FrameArray, FrameSymbol, Void } from "../frames";

export class ParseToken extends Frame {
  constructor(protected data: Frame, meta: Context = Void) {
    super(meta);
  }

  public apply(argument: Frame, parameter: Frame) {
    return argument.call(this.data);
  }
}

export class ParsePipe extends FrameArray {
  constructor(out: Frame, meta: Context = Void) {
    let data: Array<Frame> = [];
    meta[Frame.kOUT] = out;
    super(data, meta);
  }
}
