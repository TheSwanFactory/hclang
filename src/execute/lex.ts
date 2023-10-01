import { Frame, FrameAtom, FrameBytes, FrameComment, FrameQuote, ISourced, NilContext } from '../frames.js'
import { LexBytes } from './lex-bytes.js'
import { LexPipe } from './lex-pipe.js'
import { terminals } from './terminals.js'

export type Flag = { [key: string]: boolean; };

export class Token extends FrameAtom {
  constructor (protected data: Frame) {
    super(NilContext)
  }

  public called_by (callee: Frame, parameter: Frame) {
    return callee.apply(this.data, parameter)
  }

  protected toData (): any {
    return this.data
  }
}

export class Lex extends Frame implements ISourced {
  public static isTerminal (char: string) {
    const terms = Object.keys(terminals)
    return terms.includes(char)
  }

  public source: string
  public pipe: LexPipe = new LexPipe(this)
  protected body: string = ''
  protected sample: FrameAtom

  public constructor (protected Factory: any) {
    // console.debug('Lex.constructor', Factory.name)
    super()
    this.sample = new Factory('')
    this.source = ''
    this.is.void = true
    const name = this.sample.constructor.name
    this.id = this.id + '.' + name
  }

  public call (argument: Frame, _parameter = Frame.nil): Frame {
    const char = argument.toString()
    const end = this.isEnd(char)
    const terminal = Lex.isTerminal(char)
    const not_quote = !this.isQuote()
    // console.debug(`Lex.call(${char}) end: ${end} terminal: ${terminal} not_quote: ${not_quote}`)

    if (end && terminal) {
      return this.finish(argument, true)
    }
    if (end) { // not terminal
      // console.debug(`comment: ${this.isEndComment(char)} quote: ${this.isQuote()}`)
      if (this.isEndComment(char)) {
        return this.finish(argument, false)
      }
      return this.finish(argument, not_quote)
    }
    if (terminal && not_quote) { // not end but terminal
      return this.finish(argument, true)
    }

    // otherwise, add to body since still in interior
    // including quoted terminals

    if (this.body === '') {
      this.body = this.source
    }
    this.body = this.body + argument.toString()
    return this
  }

  public toString () {
    return this.id + `[${this.body}]`
  }

  protected isEnd (char: string) {
    return !this.sample.canInclude(char)
  }

  protected isEndComment (char: string) {
    return char === FrameComment.COMMENT_END
  }

  protected isQuote () {
    return (this.sample instanceof FrameQuote)
  }

  protected finish (argument: Frame, passAlong: boolean) {
    const recurse = this.checkRecursive(argument)
    if (recurse !== null) {
      return recurse
    }
    this.exportFrame()
    if (passAlong) {
      const result = this.up.call(argument)
      return result
    }
    return this.up
  }

  protected checkRecursive (_argument: Frame) {
    if (!(this.sample instanceof FrameBytes)) {
      return null
    }
    const n = parseInt(this.body, 10)
    const lex = new LexBytes(n, this.up)
    return lex
  }

  protected exportFrame () {
    const output = this.makeFrame()
    const out = this.get(Frame.kOUT)
    return out.call(output)
  }

  protected makeFrame () {
    if (this.body === '') {
      this.body = this.source
    }
    const frame = new this.Factory(this.body)
    this.body = ''
    return new Token(frame)
  }
}
