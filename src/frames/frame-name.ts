import { Frame, FrameAtom, NilContext } from "./frame";
import { FrameSymbol } from "./frame-symbol";

export class FrameName extends FrameAtom {
  public static readonly NAME_BEGIN = ".";

  protected data: FrameSymbol;

  constructor(symbol: string, meta = NilContext) {
    super(meta);
    this.data = FrameSymbol.for(symbol);
  }

  public in(contexts = [Frame.nil]) {
    return this.data;
  }

  public string_prefix() { return FrameName.NAME_BEGIN; };

  protected toData() { return this.data; }
};
