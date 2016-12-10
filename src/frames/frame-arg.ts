import { Frame } from "./frame";
import { FrameSymbol } from "./frame-symbol";

export class FrameArg extends FrameSymbol {
  public static for(symbol: string) {
    const exists = FrameArg.args[symbol];
    return exists || (FrameArg.args[symbol] = new FrameArg(symbol));
  }

  public static here() {
    return FrameArg.level();
  }

  public static level(number = 1) {
    return FrameArg.for("_".repeat(number));
  }

  protected static args: { [key: string]: FrameArg; } = {};

  protected constructor(data: string) {
    super(data);
  }

  public in(context: Frame) {
      return context;
  }
};
