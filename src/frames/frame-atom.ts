import { Frame } from './frame.js'
import { Context, NilContext } from './meta-frame.js'

export class FrameAtom extends Frame {
  constructor (meta = NilContext) {
    super(meta)
  }

  public string_prefix () {
    return ''
  };

  public string_suffix () {
    return ''
  };

  public string_start () {
    return this.string_prefix()
  };

  public toStringData (): string {
    const data = this.toData()
    const dataString = data == null ? '' : data.toString()
    return this.string_prefix() + dataString + this.string_suffix()
  }

  public toString () {
    const dataString = this.toStringData()
    const n = this.meta_length()
    if ((n === 0) || (n === 1 && this.meta[Frame.kOUT])) {
      return dataString
    }
    return this.string_open() + [dataString, this.meta_string()].join(', ') + this.string_close()
  }

  public canInclude (char: string) {
    return char !== this.string_suffix()
  }

  protected toData (): any {
    return null
  }
}

export class FrameQuote extends FrameAtom {
}
