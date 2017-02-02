import { Context, Frame, FrameArray, FrameAtom, FrameSymbol, Void } from "../frames";
import { ICurryFunction } from "../ops";

export class ParseToken extends FrameAtom {
  constructor(protected data: Frame) {
    super(Void);
  }

  public called_by(callee: Frame, parameter: Frame) {
    return callee.apply(this.data, parameter);
  }
  protected toData(): any { return this.data; }
}

export class ParseTerminal extends Frame {
  constructor(protected data: ICurryFunction) {
    super(Void);
  }

  public called_by(callee: Frame, parameter: Frame) {
    return this.data.call(callee, parameter);
  }

  protected toData(): any { return this.data; }
}

export class ParsePipe extends Frame {
  protected data: FrameArray;
  constructor(out: Frame) {
    super(Void);
    this.set(Frame.kOUT, out);
    this.data = new FrameArray([]);
  }
}
