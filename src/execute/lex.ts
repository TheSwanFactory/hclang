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

  public inspect () {
    return `Token[${this.data.inspect()}]`
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
    super()
    this.sample = new Factory('')
    this.source = ''
    this.is.void = true
    const name = this.sample.className()
    this.id = this.id + '.' + name
  }

  // TODO: use terminal to determine next parsing class
  // Right now, FrameSpace/FrameNumber consume the initial '#' of a comment
  // That should only happen at the end of a Quote

  public call (argument: Frame, _parameter = Frame.nil): Frame {
    const char = argument.toString()
    const end = this.isEnd(char)
    const terminal = Lex.isTerminal(char)
    const not_quote = !this.isQuote()
    const end_comment = this.isEndComment(char)
    console.debug(`Lex[${this.id}].call(${char}) end:${end} terminal:${terminal} not_quote:${not_quote}`)

    if (end && terminal) { // ends token on a terminal
      return this.finish(argument, true)
    }
    if (end) { // ends token, but not on a terminal
      const pass_along = not_quote && !end_comment
      console.debug(`Lex.call.end(${char}) pass_along: ${pass_along}`)
      const result = this.finish(argument, pass_along)
      return result
    }

    if (terminal && not_quote) { // unquoted terminal implicitly ends token
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
    console.debug(`Lex.finish[${argument.toString()}].passAlong: ${passAlong}`)
    const recurse = this.checkRecursive(argument)
    if (recurse !== null) {
      console.debug(`Lex.finish.recurse: ${recurse}`)
      return recurse
    }
    this.exportFrame()
    if (passAlong) {
      console.debug('Lex.finish.passAlong')
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
    console.debug(`Lex.exportFrame.output[${output.inspect()}]`)
    const out = this.get(Frame.kOUT)
    const result = out.call(output)
    return result
  }

  protected makeFrame () {
    console.debug(`Lex.makeFrame.body[${this.body}]`)
    if (this.body === '') {
      this.body = this.source
    }
    const frame = new this.Factory(this.body)
    console.log(`Lex.makeFrame.frame[${frame.inspect()}]`)
    this.body = ''
    return new Token(frame)
  }
}
