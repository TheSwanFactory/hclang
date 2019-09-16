import { Frame } from "./frame";
import { FrameAtom } from "./frame-atom";
import { FrameSymbol } from "./frame-symbol";
import { NilContext } from "./meta-frame";

export class FrameName extends FrameAtom {
  public static readonly NAME_BEGIN = ".";

  protected data: FrameSymbol;

  constructor(source: string, meta = NilContext) {
    super(meta);
    this.data = FrameSymbol.for(source);
  }

  public in(contexts = [Frame.nil]): Frame {
    const out = contexts[0];
    const setter = this.data.setter(out);
    return setter;
  }

  public string_prefix() { return FrameName.NAME_BEGIN; };

  public canInclude(char: string) {
    return FrameSymbol.SYMBOL_CHAR.test(char);
  }

  protected toData() { return this.data; }
};
