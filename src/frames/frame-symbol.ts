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

  public in(contexts = [Frame.nil]) {
    contexts.forEach((context) => {
      let value = context.get(this.data);
      if (value !== Frame.missing) { return value; };
    });
    return Frame.missing;
  }

  public called_by(context: Frame) {
    return this.in([context]);
  }

  protected toData() { return this.data; }
};
