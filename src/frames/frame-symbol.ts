import { Frame, Void } from "./frame";

export class FrameSymbol extends Frame {
  public static for(symbol: string) {
    const exists = FrameSymbol.symbols[symbol];
    return exists || (FrameSymbol.symbols[symbol] = new FrameSymbol(symbol));
  }

  public static here() {
    return FrameSymbol.for(FrameSymbol.underbar);
  }

  protected static symbols: { [key: string]: FrameSymbol; } = {};

  private static readonly underbar = "_";

  constructor(protected data: string, meta = Void) {
    super(meta);
  }

  public in(context = Frame.nil) {
    if (this.data === FrameSymbol.underbar) {
      return context;
    }
    return context.get(this.data);
  }

  public called_by(context: Frame) {
    return this.in(context);
  }

  public toString() {
    return this.meta_wrap(this.data);
  }
};
