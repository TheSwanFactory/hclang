import { Frame } from "./frame.ts";
import { FrameNote } from "./frame-note.ts";
import { FrameSymbol } from "./frame-symbol.ts";

export class FrameArg extends FrameSymbol {
  public static readonly ARG_CHAR = "_";

  public static here(): FrameArg {
    return FrameArg.level();
  }

  public static level(count = 1): FrameArg {
    const symbol = Array(count + 1).join(FrameArg.ARG_CHAR);
    return FrameArg._for(symbol);
  }

  protected static args: { [key: string]: FrameArg } = {};

  protected static _for(symbol: string): FrameArg {
    const exists = FrameArg.args[symbol];
    return exists || (FrameArg.args[symbol] = new FrameArg(symbol));
  }

  /* protected constructor (data: string) {
        super(data)
    } */

  public override in(contexts = [Frame.nil]): Frame {
    const level = this.data.length;
    if (level <= 1) {
      return contexts[0];
    } else {
      return FrameArg.level(level - 1);
    }
  }
}

export class FrameParam extends FrameSymbol {
  public static readonly ARG_CHAR = "^";

  public static there(): FrameParam {
    return FrameParam.level();
  }

  public static level(count = 1): FrameParam {
    const symbol = FrameArg.ARG_CHAR +
      Array(count + 1).join(FrameParam.ARG_CHAR);
    return FrameParam._for(symbol);
  }

  protected static params: { [key: string]: FrameParam } = {};

  protected static _for(symbol: string): FrameParam {
    const exists = FrameParam.params[symbol];
    return exists || (FrameParam.params[symbol] = new FrameParam(symbol));
  }

  /* protected constructor (data: string) {
        super(data)
    } */

  public override in(contexts = [Frame.nil]): Frame {
    const level = this.data.length - 1;
    if (level <= contexts.length) {
      return contexts[level];
    } else {
      return FrameNote.key(this.data, this);
    }
  }
}
