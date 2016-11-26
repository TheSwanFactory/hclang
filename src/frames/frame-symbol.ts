import { Frame, Void } from "./frame";

export class FrameSymbol extends Frame {
  public static for(symbol: string) {
    const exists = FrameSymbol.symbols[symbol];
    return exists || (FrameSymbol.symbols[symbol] = new FrameSymbol(symbol));
  }

  protected static symbols: { [key: string]: FrameSymbol; } = {};

  constructor(protected data: string, meta = Void) {
    super(meta);
  }

  public in(context = Frame.nil) {
    if (this.data === "_") {
      return context;
    }
    return context.get(this.data);
  }

  public toString() {
    const meta = this.meta_string();
    if (meta !== "") {
      return `(${meta} ${this.data})`;
    }
    return this.data;
  }
};
