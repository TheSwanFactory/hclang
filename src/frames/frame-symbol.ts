import { Frame } from "./frame";

export class FrameSymbol extends Frame {
  protected static symbols: { [key: string]: FrameSymbol; } = {};

  public static for(symbol: string) {
    const exists = FrameSymbol.symbols[symbol];
    return exists || (FrameSymbol.symbols[symbol] = new FrameSymbol(symbol));
  }

  protected data: string;

  constructor(symbol: string) {
    super();
    this.data = symbol;
  }

  public toString() {
    return this.data;
  }
};
