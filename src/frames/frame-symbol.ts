import { Frame } from "./frame";

export class FrameSymbol extends Frame {
  public static for(symbol: string) {
    const exists = FrameSymbol.symbols[symbol];
    return exists || (FrameSymbol.symbols[symbol] = new FrameSymbol(symbol));
  }

  protected static symbols: { [key: string]: FrameSymbol; } = {};

  constructor(protected data: string) {
    super();
  }

  public toString() {
    return this.data;
  }
};