import { Frame } from "./frame";
import { FrameSymbol } from "./frame-symbol";

export class FrameArg extends FrameSymbol {
  public static here() {
    return FrameArg.level();
  }

  public static level(count = 1) {
    const symbol = Array(count + 1).join(FrameArg.underbar);
    return FrameArg._for(symbol);
  }

  protected static args: { [key: string]: FrameArg; } = {};

  protected static _for(symbol: string) {
    const exists = FrameArg.args[symbol];
    return exists || (FrameArg.args[symbol] = new FrameArg(symbol));
  }

  private static readonly underbar = "_";

  protected constructor(data: string) {
    super(data);
  }

  public in(context: Frame) {
      return context;
  }
};
