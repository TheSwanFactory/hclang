import { Context, Frame, FrameString, FrameSymbol, Void } from "../frames";

export class ParsePipe extends Frame {
  constructor(out: Frame, meta: Context = Void) {
    meta[Frame.kOUT] = out;
    super(meta);
  }
}
