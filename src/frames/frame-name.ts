import { Frame, NilContext } from "./frame";
import { FrameAtom } from "./frame-atom";
import { FrameSymbol } from "./frame-symbol";

export class FrameName extends FrameAtom {
  public static readonly NAME_BEGIN = ".";

  protected data: FrameSymbol;

  constructor(source: string, meta = NilContext) {
    super(source, meta);
    this.data = FrameSymbol.for(source);
  }

  public in(contexts = [Frame.nil]) {
    return this.data;
  }

  public string_prefix() { return FrameName.NAME_BEGIN; };

  protected toData() { return this.data; }
};
