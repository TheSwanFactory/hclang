import { Context, Frame, FrameArray, FrameExpr, FrameSymbol } from "../frames";
import { Terminal } from "./terminals";

export class ParsePipe extends FrameArray {
  protected factory: any;

  constructor(out: Frame) {
    const meta: Context = {};
    meta[ParsePipe.kOUT] = out;
    meta[Frame.kEND] = Terminal.end();
    super([], meta);
    this.factory = FrameExpr;
  }

  public push(argument: Frame): Frame {
    const child = new ParsePipe(this);
    return child;
  }

  public pop(argument: Frame): Frame {
    const parent = this.get(ParsePipe.kOUT);
    return parent;
  }

  public finish(argument: Frame): Frame {
    const out = this.get(Frame.kOUT);
    const result = this.makeFrame();
    const terminal = FrameSymbol.end();
    out.call(result);
    out.call(terminal);
    this.reset();
    return result;
  }

  protected makeFrame() {
    const current = this.asArray();
    const instance = new this.factory(current);
    return instance;
  }
}
