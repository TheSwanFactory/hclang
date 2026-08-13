import { Frame } from "./frame.ts";
import { FrameNote } from "./frame-note.ts";
import { FrameLazy } from "./frame-lazy.ts";
import { FrameSymbol } from "./frame-symbol.ts";
import { type Context, NilContext } from "./context.ts";
import { ScanDisposition, type ScanResult, type SigilStart } from "../scan.ts";

const findClosure = (contexts: Frame[]): FrameLazy | undefined => {
  return contexts.find((context) => context instanceof FrameLazy) as
    | FrameLazy
    | undefined;
};

export class FrameArg extends FrameSymbol {
  public static readonly ARG_CHAR = "_";
  public static override readonly SIGIL_STARTS: readonly SigilStart[] = [
    { key: FrameArg.ARG_CHAR, mode: "atom" },
  ];

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

  constructor(source: string, meta: Context = NilContext) {
    // Normalize empty source to a single underscore so lexer quirks still produce a usable arg token.
    const normalized = source === "" ? FrameArg.ARG_CHAR : source;
    super(normalized, meta);
  }

  public override string_start(): string {
    return FrameArg.ARG_CHAR;
  }

  public override canInclude(char: string): boolean {
    return char === FrameArg.ARG_CHAR || char === FrameParam.ARG_CHAR;
  }

  public override scan(symbol: Frame, source = ""): ScanResult {
    const char = symbol.toString();
    // The leading `_` selected this family; a first caret selects parameters.
    if (char === FrameParam.ARG_CHAR && source === "") {
      return {
        disposition: ScanDisposition.Transition,
        frame: FrameParam.level(),
      };
    }
    if (this.canInclude(char)) {
      return { disposition: ScanDisposition.Consume };
    }
    return {
      disposition: ScanDisposition.CompleteRedispatch,
      frame: this.completeAtom(source),
    };
  }

  public override finishInput(source = ""): ScanResult {
    return {
      disposition: ScanDisposition.CompleteConsume,
      frame: this.completeAtom(source),
    };
  }

  public override in(contexts = [Frame.nil]): Frame {
    const level = this.data.length;
    if (level <= 1) {
      return contexts[0];
    }

    const closure = findClosure(contexts);
    if (!closure) {
      // When no closure, decrement the level
      return FrameArg.level(level - 1);
    }

    let target: Frame | undefined = closure;
    for (let i = 1; i < level; i++) {
      target = target?.up;
      if (!target) {
        return FrameNote.key(this.data, this);
      }
    }
    return target;
  }

  private completeAtom(source: string): FrameArg {
    return /^_*$/.test(source)
      ? FrameArg.level(source.length + 1)
      : new FrameArg(`_${source}`);
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

  public override scan(symbol: Frame, source = ""): ScanResult {
    if (symbol.toString() === FrameParam.ARG_CHAR) {
      return { disposition: ScanDisposition.Consume };
    }
    return {
      disposition: ScanDisposition.CompleteRedispatch,
      frame: this.completeAtom(source),
    };
  }

  public override finishInput(source = ""): ScanResult {
    return {
      disposition: ScanDisposition.CompleteConsume,
      frame: this.completeAtom(source),
    };
  }

  public override in(contexts = [Frame.nil]): Frame {
    const level = this.data.length - 1; // number of ^

    // Parameters are stored in the contexts array
    // contexts[0] is the argument, contexts[1] is the parameter
    const paramIndex = level;
    if (paramIndex < contexts.length && contexts[paramIndex] !== Frame.nil) {
      return contexts[paramIndex];
    }

    // A nil parameter is the placeholder used for an ordinary closure call.
    // In that case, walk up the captured scope instead.
    const closure = findClosure(contexts);
    if (!closure) {
      return FrameNote.key(this.data, this);
    }

    let target: Frame | undefined = closure;
    for (let i = 0; i < level; i++) {
      target = target?.up;
      if (!target) {
        return FrameNote.key(this.data, this);
      }
    }
    return target;
  }

  private completeAtom(source: string): FrameParam {
    return FrameParam.level(this.data.length - 1 + source.length);
  }
}
