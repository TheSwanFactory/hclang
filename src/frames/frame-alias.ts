import { Frame } from "./frame";
import { FrameAtom } from "./frame-atom";
import { FrameNote } from "./frame-note";
import { FrameSymbol } from "./frame-symbol";
import { NilContext } from "./meta-frame";

export class FrameAlias extends FrameAtom {
  public static readonly ALIAS_BEGIN = "@";

  protected data: FrameSymbol;

  constructor(source: string, meta = NilContext) {
    super(meta);
    this.data = FrameSymbol.for(source);
  }

  public in(contexts = [Frame.nil]): Frame {
    const key = this.data.toString();
    for (const context of contexts) {
      const out = this.find(context, key);
      if (out !== Frame.nil) {
        const setter = this.data.setter(out);
        return setter;
      }
    }
    return FrameNote.key(key, this);
  }

  public string_prefix() { return FrameAlias.ALIAS_BEGIN; };

  public canInclude(char: string) {
    return FrameSymbol.SYMBOL_CHAR.test(char);
  }

  protected toData() { return this.data; }

  protected find(context: Frame, key: string) {
    while (context !== Frame.missing) {
      const here = context.get_here(key);
      if (!here.is.missing) {
        return context;
      }
      context = context.up;
    }
    return Frame.nil;
  }
};
