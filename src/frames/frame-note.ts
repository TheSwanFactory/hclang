import { Frame } from './frame'
import { FrameArray } from './frame-array'
import { FrameQuote } from './frame-atom'
import { FrameString } from './frame-string'
import { FrameSymbol } from './frame-symbol'
import { NilContext } from './meta-frame'

export type Binding = { [key: string]: string; };
export type LanguageBinding = { [key: string]: Binding; };

export class FrameNote extends FrameQuote {
  public static readonly NOTE_BEGIN = '$'
  public static readonly NOTE_END = ';'
  public static readonly NOTE_EXTRAS = '++'

  public static readonly LABELS: LanguageBinding = {
    en: {
      '!': 'name-missing',
      '+': 'test-pass',
      '-': 'test-fail',
      '<>': 'type-mismatch',
      '>': 'bounds-exceeded'
    }
  }

  public static test (data: string, source: string, sum: string) {
    const note = new FrameNote(data, source)
    const result = new FrameString(sum)
    note.set('n', result)
    return note
  };

  public static key (source: string, where: Frame) {
    return new FrameNote('!', source, where)
  };

  public static type (source: string) {
    return new FrameNote('<>', source)
  };

  public static index (source: string) {
    return new FrameNote('>', source)
  };

  public static pass (source: string, sum: string) {
    return FrameNote.test('+', source, sum)
  };

  public static fail (source: string, sum: string) {
    return FrameNote.test('-', source, sum)
  };

  constructor (protected data: string, source: string, public where = Frame.nil) {
    super(NilContext)
    this.up = where
    this.is.note = true
    this.setLabel(data, source)
    this.id += this.data
  }

  public in (_contexts = [Frame.nil]): Frame {
    return this
  }

  public call (argument: Frame, parameter = Frame.nil): Frame {
    if (argument !== FrameSymbol.end()) {
      const result = this.addExtra(argument, parameter)
      return result
    }
    const output = this.get(Frame.kOUT)
    output.call(this)
    output.call(FrameSymbol.end())
    return this.up
  }

  public string_prefix () {
    return FrameNote.NOTE_BEGIN
  };

  public string_suffix () {
    return FrameNote.NOTE_END
  };

  public toString () {
    return this.string_prefix() + this.data + this.meta_string()
  }

  protected setLabel (data: string, source: string) {
    const label = FrameNote.LABELS.en[data]
    let value = new FrameString(data)
    let key = '!'
    if (label) {
      key = label
      value = new FrameString(source)
    }
    if (key === '!') {
      this.is.missing = true
    }
    this.set(key, value)
  }

  protected addExtra (argument: Frame, parameter: Frame) {
    let extras = this.get(FrameNote.NOTE_EXTRAS)
    if (extras.is.missing) {
      extras = new FrameArray([])
      this.set(FrameNote.NOTE_EXTRAS, extras)
    }
    extras.apply(argument, parameter)
    return this
  }
};
