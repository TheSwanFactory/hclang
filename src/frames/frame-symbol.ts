import { Frame, FrameAtom, Void } from "./frame";

export class FrameSymbol extends FrameAtom {
  public static for(symbol: string) {
    const exists = FrameSymbol.symbols[symbol];
    return exists || (FrameSymbol.symbols[symbol] = new FrameSymbol(symbol));
  }

  public static direct(symbol: string) {
    const exists = FrameSymbol.directs[symbol];
    return exists || (FrameSymbol.directs[symbol] = new FrameSymbol(symbol, {"!": Frame.nil}));
  }

  protected static symbols: { [key: string]: FrameSymbol; } = {};
  protected static directs: { [key: string]: FrameSymbol; } = {};

  constructor(protected data: string, meta = Void) {
    super(meta);
  }

  public in(contexts = [Frame.nil]) {
    for (let context of contexts) {
      let value = context.get(this.data);
      if (value !== Frame.missing) {
        value.up = context;
        const direct = this.get_here(FrameSymbol.kDIRECT);
        if (direct === Frame.missing) {
          return value;
        } else {
          console.log(" * direct");
          return value.call(context);
        }
      }
    }
    return Frame.missing;
  }

  public called_by(context: Frame) {
    return this.in([context]);
  }

  protected toData() { return this.data; }
};
