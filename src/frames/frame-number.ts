import * as _ from 'lodash'
import { FrameAtom } from './frame-atom'
import { Context, NilContext } from './meta-frame'

export class FrameNumber extends FrameAtom {
  public static readonly NUMBER_BEGIN = /[1-9]/;
  public static readonly NUMBER_CHAR = /\d/;

  public static for (digits: string) {
    const exists = FrameNumber.numbers[digits]
    return exists || (FrameNumber.numbers[digits] = new FrameNumber(digits))
  }

  protected static numbers: { [key: string]: FrameNumber; } = {};
  protected data: number;

  constructor (source: string, meta: Context = NilContext) {
    super(meta)
    this.data = _.toNumber(source)
  }

  public string_start () {
    return FrameNumber.NUMBER_BEGIN.toString()
  };

  public canInclude (char: string) {
    return FrameNumber.NUMBER_CHAR.test(char)
  }

  protected toData () {
    return this.data
  }
};
