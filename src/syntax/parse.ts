import { Context, Frame, FrameArray, FrameSymbol, Void } from "../frames";

export class ParseToken extends Frame {
  constructor(protected data: Frame) {
    super(Void);
  }

  public called_by(context: Frame, parameter: Frame) {
    return context.apply(this.data, parameter);
  }
}

export class ParseTerminal extends Frame {
  constructor(protected data: Frame) {
    super(Void);
  }

  public called_by(context: Frame, parameter: Frame) {
    return context.apply(this.data, parameter);
  }
}

export class ParsePipe extends Frame {
  protected data: FrameArray;
  protected context: Frame;
  constructor(out: Frame) {
    super(Void);
    this.set(Frame.kOUT, out);
    this.data = new FrameArray([]);
    this.context = new Frame();
  }
}
