import { Context, Frame, FrameArray, FrameAtom, FrameExpr, FrameSymbol, NilContext } from "../frames";
import { Terminal } from "./terminals";

export class Parser extends FrameArray {
  constructor(out: Frame) {
    const meta: Context = {};
    meta[Parser.kOUT] = out;
    meta[Frame.kEND] = Terminal.end();
    super([], meta);
  }

  public push(): Frame {
    const child = new Parser(this);
    return child;
  }

  public pop(): Frame {
    const parent = this.get(Parser.kOUT);
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
