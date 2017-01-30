import { Context, Frame, FrameArray, FrameSymbol, Void } from "../frames";

export class ParsePipe extends FrameArray {
  constructor(out: Frame, meta: Context = Void) {
    let data: Array<Frame> = [];
    meta[Frame.kOUT] = out;
    super(data, meta);
  }
}
