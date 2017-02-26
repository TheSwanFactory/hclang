import { Context, Frame, FrameArray, FrameAtom, FrameExpr, Void } from "../frames";
import { ICurryFunction } from "../ops";
import { LexTerminal } from "./terminals";

export const ender: ICurryFunction = (source: Frame, parameter: Frame) => {
  const pipe = source as ParsePipe;
  return pipe.finish();
};

export class ParsePipe extends FrameArray {

  constructor(out: Frame) {
    const meta: Context = {};
    meta[ParsePipe.kOUT] = out;
    meta[Frame.kEND] = new LexTerminal(ender);
    super([], meta);
  }

  public finish(): Frame {
    const current = this.asArray();
    const expr = new FrameExpr(current);
    const out = this.get(Frame.kOUT);
    out.call(expr);
    return expr;
  }
}

export class ParseToken extends FrameAtom {
  constructor(protected data: Frame) {
    super(Void);
  }

  public called_by(callee: Frame, parameter: Frame) {
    return callee.apply(this.data, parameter);
  }
  protected toData(): any { return this.data; }
}
