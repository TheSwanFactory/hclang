import { Frame } from "./frame";
import { FrameAtom } from "./frame-atom";
import { FrameSymbol } from "./frame-symbol";
import { Context, NilContext } from "./meta-frame";

export class FrameName extends FrameAtom {
  public static readonly NAME_BEGIN = ".";

  protected data: FrameSymbol;

  constructor(source: string, meta = NilContext) {
    super(meta);
    this.data = FrameSymbol.for(source);
  }

  public in(contexts = [Frame.nil]) {
    const out = contexts[contexts.length - 1];
    // console.error(`\n** FrameName[${this.data}].out`);
    // console.error(out);
    const setter = this.data.setter(out);
    return setter;
  }

  public string_prefix() { return FrameName.NAME_BEGIN; };

  public canInclude(char: string) {
    return FrameSymbol.SYMBOL_CHAR.test(char);
  }

  protected toData() { return this.data; }
};
