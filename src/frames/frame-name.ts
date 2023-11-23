import { Frame } from './frame.js'
import { FrameAtom } from './frame-atom.js'
import { FrameOperator, FrameSymbol } from './frame-symbol.js'
import { ISourced, NilContext } from './meta-frame.js'

export class FrameName extends FrameAtom implements ISourced {
  public static readonly NAME_BEGIN = '.'

  public source: string
  protected data: FrameSymbol

  constructor (source: string, meta = NilContext) {
    super(meta)
    this.data = FrameSymbol.for(source)
    this.source = source
  }

  public in (contexts = [Frame.nil]): Frame {
    const out = contexts[0]
    const setter = this.data.setter(out)
    return setter
  }

  public string_prefix () {
    return FrameName.NAME_BEGIN
  };

  public canInclude (char: string) {
    return FrameSymbol.SYMBOL_CHAR.test(char) ||
           FrameOperator.OPERATOR_CHARS.test(char)
  }

  protected toData () {
    return this.data
  }
};
