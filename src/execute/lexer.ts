import * as _ from 'lodash.js'
import { Frame, FrameString } from '../frames.js'
import { syntax } from './syntax.js'

export type LexOptions = { [key: string]: any; };

export class Lexer extends Frame {
  constructor (out: Frame) {
    syntax[Lexer.kOUT] = out
    super(syntax)
  }

  public lex_string (input: string) {
    const source = new FrameString(input)
    return this.lex(source)
  }

  public lex (source: FrameString) {
    return source.reduce(this)
  }

  public fold (argument: Frame) {
    const out = this.get(Frame.kOUT)
    this.set(Frame.kOUT, out.call(argument))
  }

  public finish (_options: LexOptions) {
    return Frame.nil
  }
}
