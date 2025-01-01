import { Frame } from './frame.ts'
import { FrameAtom } from './frame-atom.ts'
import { FrameOperator, FrameSymbol } from './frame-symbol.ts'
import { ISourced, NilContext } from './meta-frame.ts'

export class FrameName extends FrameAtom implements ISourced {
  public static readonly NAME_BEGIN = '.'

  public source: string
  protected data: FrameSymbol

  constructor (source: string, meta = NilContext) {
    super(meta)
    this.data = FrameSymbol.for(source)
    this.source = source
  }

  public override in (contexts = [Frame.nil]): Frame {
    const out = contexts[0]
    const setter = this.data.setter(out)
    return setter
  }

  public override string_prefix () {
    return FrameName.NAME_BEGIN
  };

  public override canInclude (char: string) {
    return FrameSymbol.SYMBOL_CHAR.test(char) ||
           FrameOperator.OPERATOR_CHARS.test(char)
  }

  protected override toData () {
    return this.data
  }
};
