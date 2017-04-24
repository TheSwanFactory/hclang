import * as _ from "lodash";
import { Frame } from "./frame";
import { FrameQuote } from "./frame-atom";
import { FrameSymbol } from "./frame-symbol";
import { Context, NilContext } from "./meta-frame";

const reducer = (current: Frame, char: string) => {
  const symbol = FrameSymbol.for(char);
  return current.call(symbol);
};

export class FrameString extends FrameQuote {
  public static readonly STRING_BEGIN = "“";
  public static readonly STRING_END = "”";

  constructor(protected data: string, meta: Context = NilContext) {
    super(meta);
  }

  public apply(argument: FrameString) {
    return new FrameString(this.data + argument.data);
  }

  public string_prefix() { return FrameString.STRING_BEGIN; };

  public string_suffix() { return FrameString.STRING_END; };

  public reduce(iteratee: Frame) {
    const final: Frame = _.reduce(this.data, reducer, iteratee);
    return final.call(FrameSymbol.end());
  }

  protected toData() { return this.data; }

};
