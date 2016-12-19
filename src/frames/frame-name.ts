import { Frame, FrameAtom, Void } from "./frame";
import { FrameSymbol } from "./frame-symbol";

export class FrameName extends FrameAtom {
  public static readonly NAME_BEGIN = ".";

  protected data: FrameSymbol;

  constructor(symbol: string, meta = Void) {
    super(meta);
    this.data = FrameSymbol.for(symbol);
  }

  public in(context = Frame.nil) {
    return this.data;
  }

  public string_prefix() { return FrameName.NAME_BEGIN; };

  protected toData() { return this.data; }
};
