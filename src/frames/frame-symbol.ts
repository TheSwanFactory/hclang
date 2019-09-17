import { Frame } from "./frame";
import { FrameAtom } from "./frame-atom";
import { FrameNote } from "./frame-note";
import { Context, NilContext } from "./meta-frame";

export class FrameSymbol extends FrameAtom {
  public static readonly SYMBOL_BEGIN = /[-a-zA-Z]/;
  public static readonly SYMBOL_CHAR = /[-\w]/;

  public static for(symbol: string) {
    const exists = FrameSymbol.symbols[symbol];
    return exists || (FrameSymbol.symbols[symbol] = new FrameSymbol(symbol));
  }

  public static end() { return FrameSymbol.for(Frame.kEND); };

  protected static symbols: { [key: string]: FrameSymbol; } = {};

  constructor(protected data: string, meta = NilContext) {
    super(meta);
  }

  public in(contexts = [Frame.nil]): Frame {
    const first = contexts[0];
    for (const context of contexts) {
      const value = context.get(this.data);
      if (!value.is.missing) {
        value.up = context;
        if (value.is.immediate === true) {
          return value.call(context);
        }
        return value;
      }
    }
    return FrameNote.key(first.id + "." + this.data, first);
  }

  public apply(argument: Frame, _parameter: Frame) {
    const out = this.get(Frame.kOUT);
    out.set(this.data, argument);
    return this;
  }

  public setter(out: Frame) {
    const meta: Context = {};
    if (!out.is.void) {
      meta[Frame.kOUT] = out;
    }
    const setter = new FrameSymbol(this.data, meta);
    return setter;
  }

  public called_by(context: Frame) {
    return this.in([context]);
  }

  public string_start() {
    return FrameSymbol.SYMBOL_BEGIN.toString();
  };

  public canInclude(char: string) {
    return FrameSymbol.SYMBOL_CHAR.test(char);
  }

  protected toData() { return this.data; }
};
