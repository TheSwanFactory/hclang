import { Context, Frame, FrameArray, FrameLazy, FrameString, FrameSymbol, Void } from "../frames";
import { LexPipe } from "./lex-pipe";
import { ParsePipe } from "./parse";

export class EvalPipe extends Frame {
  constructor(out: Frame, meta: Context = Void) {
    super(meta);
    this.set(ParsePipe.kOUT, out);
  }
}
