import { Frame, Void } from "./frame";
import { FrameSymbol } from "./frame-symbol";

export class FrameName extends Frame {
  public static readonly NAME_BEGIN = ".";

  protected data: FrameSymbol;

  constructor(symbol: string, meta = Void) {
    super(meta);
    this.data = FrameSymbol.for(symbol);
  }

  public in(context = Frame.nil) {
    return this.data;
  }

  public toStringData() {
    return FrameName.NAME_BEGIN + this.data.toString();
  }

  public toString() {
    return this.meta_wrap(this.toStringData());
  }
};
