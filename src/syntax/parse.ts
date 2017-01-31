import { Context, Frame, FrameArray, FrameSymbol, Void } from "../frames";

export class ParseToken extends Frame {
  constructor(token: Frame, meta: Context = Void) {
    super(meta);
  }
}

export class ParsePipe extends FrameArray {
  constructor(out: Frame, meta: Context = Void) {
    let data: Array<Frame> = [];
    meta[Frame.kOUT] = out;
    super(data, meta);
  }
}
