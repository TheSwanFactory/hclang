import { Frame } from "./frame";
import { FrameAtom } from "./frame-atom";
import { FrameSymbol } from "./frame-symbol";
import { Context, NilContext } from "./meta-frame";

export class FrameNote extends FrameAtom {
  public static readonly NAME_BEGIN = "$";

  protected data: FrameSymbol;

  constructor(source: string, meta = NilContext) {
    super(meta);
    this.data = FrameSymbol.for(source);
  }

  public in(contexts = [Frame.nil]) {
    return this;
  }

  public string_prefix() { return FrameNote.NAME_BEGIN; };

  public canInclude(char: string) {
    return FrameSymbol.SYMBOL_CHAR.test(char);
  }

  protected toData() { return this.data; }
};
