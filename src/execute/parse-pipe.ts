import { Context, Frame, FrameArray, FrameAtom, FrameExpr, Void } from "../frames";
import { Terminal } from "./terminals";

export class ParsePipe extends FrameArray {
  constructor(out: Frame) {
    const meta: Context = {};
    meta[ParsePipe.kOUT] = out;
    meta[Frame.kEND] = Terminal.end();
    super([], meta);
  }

  public finish(): Frame {
    const current = this.asArray();
    const expr = new FrameExpr(current);
    const out = this.get(Frame.kOUT);
    out.call(expr);
    this.reset();
    return expr;
  }
}
