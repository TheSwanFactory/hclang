import { Frame } from "./frame.ts";
import { FrameNote } from "./frame-note.ts";
import { FrameLazy } from "./frame-lazy.ts";
import { FrameSymbol } from "./frame-symbol.ts";
import { type Context, NilContext } from "./context.ts";
import {
  type AtomSyntax,
  ScanDisposition,
  type ScanResult,
  type SigilStart,
} from "../scan.ts";

const findClosure = (contexts: Frame[]): FrameLazy | undefined => {
  return contexts.find((context) => context instanceof FrameLazy) as
    | FrameLazy
    | undefined;
};

/** An underscore run denotes a level; a trailing suffix names the argument. */
const completeArg = (source: string): FrameArg =>
  /^_*$/.test(source)
    ? FrameArg.level(source.length + 1)
    : new FrameArg(`_${source}`);

/** A leading caret after `_` denotes a parameter level. */
const completeLexeme = (source: string): FrameArg | FrameParam =>
  source.startsWith(FrameParam.ARG_CHAR)
    ? FrameParam.level(source.length)
    : completeArg(source);

export class FrameArg extends FrameSymbol {
  public static readonly ARG_CHAR = "_";
  public static override readonly SIGIL_STARTS: readonly SigilStart[] = [
    { key: FrameArg.ARG_CHAR, mode: "atom" },
  ];

  public static override readonly SYNTAX: AtomSyntax = {
    NAME: "FrameArg",
    SIGIL_STARTS: FrameArg.SIGIL_STARTS,
    recognize: (symbol: Frame, source = ""): ScanResult => {
      const char = symbol.toString();

      // A caret immediately after the selecting `_` changes this lexeme from
      // an argument to a parameter. The source buffer carries the whole level,
      // so no runtime FrameParam is needed as a receiver.
      if (source.startsWith(FrameParam.ARG_CHAR)) {
        return char === FrameParam.ARG_CHAR
          ? { disposition: ScanDisposition.Consume }
          : {
            disposition: ScanDisposition.CompleteRedispatch,
            frame: completeLexeme(source),
          };
      }

      if (char === FrameArg.ARG_CHAR || char === FrameParam.ARG_CHAR) {
        return { disposition: ScanDisposition.Consume };
      }
      return {
        disposition: ScanDisposition.CompleteRedispatch,
        frame: completeLexeme(source),
      };
    },
    finish: (source = ""): ScanResult => ({
      disposition: ScanDisposition.CompleteConsume,
      frame: completeLexeme(source),
    }),
  };

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
}
