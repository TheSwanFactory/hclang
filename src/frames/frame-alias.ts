import { Frame } from "./frame.ts";
import { FrameAtom } from "./frame-atom.ts";
import { FrameNote } from "./frame-note.ts";
import { FrameSymbol } from "./frame-symbol.ts";
import { NilContext } from "./meta-frame.ts";

export class FrameAlias extends FrameAtom {
  public static readonly ALIAS_BEGIN = "@";

  protected data: FrameSymbol;

  constructor(source: string, meta = NilContext) {
    super(meta);
    this.data = FrameSymbol.for(source);
  }

  public override in(contexts = [Frame.nil]): Frame {
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

  public override string_prefix() {
    return FrameAlias.ALIAS_BEGIN;
  }

  public override canInclude(char: string) {
    return FrameSymbol.SYMBOL_CHAR.test(char);
  }

  protected override toData() {
    return this.data;
  }

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
}
