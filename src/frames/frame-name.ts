import { Frame, Void } from "./frame";
import { FrameSymbol } from "./frame-symbol";

export class FrameName extends Frame {
  protected data: FrameSymbol;

  constructor(symbol: string, meta = Void) {
    super(meta);
    this.data = FrameSymbol.for(symbol);
  }

  public in(context = Frame.nil) {
    return this.data;
  }

  public called_by(context: Frame) {
    return this.in(context);
  }

  public toStringData() {
    return "." + this.data.toString();
  }

  public toString() {
    return this.meta_wrap(this.toStringData());
  }
};
