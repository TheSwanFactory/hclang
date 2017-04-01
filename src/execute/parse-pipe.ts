import { Context, Frame, FrameArray, FrameAtom, FrameExpr, FrameSymbol, Void } from "../frames";
import { Terminal } from "./terminals";

export class ParsePipe extends FrameArray {
  constructor(out: Frame) {
    const meta: Context = {};
    meta[ParsePipe.kOUT] = out;
    meta[Frame.kEND] = Terminal.end();
    super([], meta);
  }

  public push(): Frame {
    const child = new ParsePipe(this);
    return child;
  }

  public pop(): Frame {
    const parent = this.get(ParsePipe.kOUT);
    return parent;
  }

  public finish(): Frame {
    const terminal = FrameSymbol.end();
    const result = this.makeFrame();
    const out = this.get(Frame.kOUT);
    out.call(result);
    out.call(terminal);
    this.reset();
    return result;
  }

  protected makeFrame() {
    const current = this.asArray();
    return new FrameExpr(current);
  }
}
