import * as _ from 'lodash'
import { Frame } from './frame'
import { FrameAtom, FrameQuote } from './frame-atom'
import { FrameSymbol } from './frame-symbol'
import { Context, NilContext } from './meta-frame'

const reducer = (current: Frame, char: string) => {
  const symbol = FrameSymbol.for(char)
  const result = current.call(symbol)
  return result
}

export class FrameString extends FrameQuote {
  public static readonly STRING_BEGIN = '“';
  public static readonly STRING_END = '”';

  constructor (protected data: string, meta: Context = NilContext) {
    super(meta)
  }

  public apply (argument: FrameAtom) {
    let value = argument.toString()
    if (argument instanceof FrameString) {
      value = argument.data
    }
    return new FrameString(this.data + value)
  }

  public string_prefix () {
    return FrameString.STRING_BEGIN
  };

  public string_suffix () {
    return FrameString.STRING_END
  };

  public reduce (starter: Frame) {
    const final = _.reduce(this.data, reducer, starter) as Frame
    const result = final.call(FrameSymbol.end())
    return result
  }

  protected toData () {
    return this.data
  }
};
