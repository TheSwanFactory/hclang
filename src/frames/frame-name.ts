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
    return this.data;
  }

  public string_prefix() { return FrameName.NAME_BEGIN; };

  protected toData() { return this.data; }
};
