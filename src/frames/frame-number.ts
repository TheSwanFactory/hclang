import { Frame } from './frame.js'
import { FrameAtom } from './frame-atom.js'
import { FrameString } from './frame-string.js'
import { Context, NilContext } from './meta-frame.js'

export class FrameNumber extends FrameAtom {
  public static readonly NUMBER_BEGIN = /[1-9]/
  public static readonly NUMBER_CHAR = /\d/

  public static for (digits: string) {
    const exists = FrameNumber.numbers[digits]
    return exists || (FrameNumber.numbers[digits] = new FrameNumber(digits))
  }

  // eslint-disable-next-line no-use-before-define
  protected static numbers: { [key: string]: FrameNumber; } = {}
  protected data: number

  constructor (source: string, meta: Context = NilContext) {
    super(meta)
    this.data = parseInt(source, 10)
  }

  public apply (argument: Frame, _parameter: Frame) : Frame {
    // repeatedly apply argument `this.data` times
    let result = Frame.nil
    this.range () .forEach (() => {
      result = result.apply(argument, _parameter)
    })
    return result
  }

  public range () : Array<number> {
    return [...Array(this.data).keys()]
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
