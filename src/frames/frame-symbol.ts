import { Frame, FrameAtom, Void } from "./frame";

export class FrameSymbol extends FrameAtom {
  public static for(symbol: string) {
    const exists = FrameSymbol.symbols[symbol];
    return exists || (FrameSymbol.symbols[symbol] = new FrameSymbol(symbol));
  }

  protected static symbols: { [key: string]: FrameSymbol; } = {};

  constructor(protected data: string, meta = Void) {
    super(meta);
  }

  public in(context = Frame.nil) {
    return context.get(this.data);
  }

  public called_by(context: Frame) {
    return this.in(context);
  }

  public toData() { return this.data; }
};
