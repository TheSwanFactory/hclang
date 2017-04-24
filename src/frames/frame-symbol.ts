import { Frame, NilContext } from "./frame";
import { FrameAtom } from "./frame-atom";

export class FrameSymbol extends FrameAtom {
  public static for(symbol: string) {
    const exists = FrameSymbol.symbols[symbol];
    return exists || (FrameSymbol.symbols[symbol] = new FrameSymbol(symbol));
  }

  public static end() { return FrameSymbol.for(Frame.kEND); };

  protected static symbols: { [key: string]: FrameSymbol; } = {};

  constructor(protected data: string, meta = NilContext) {
    super(meta);
  }

  public in(contexts = [Frame.nil]) {
    for (const context of contexts) {
      const value = context.get(this.data);
      if (value !== Frame.missing) {
        value.up = context;
        if (value.callme === false) {
          return value;
        } else {
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
