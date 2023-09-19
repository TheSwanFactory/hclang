import { Frame, FrameString, FrameSymbol } from '../frames.js'
import { ParsePipe } from './parse-pipe.js'
import { syntax } from './syntax.js'
import { IAction, IFinish, IPerformer } from './terminals.js'

export class LexPipe extends Frame implements IFinish, IPerformer {
  public level: number

  constructor (out: Frame) {
    syntax[Frame.kOUT] = out
    super(syntax)
    this.level = 0
  }

  public lex_string (input: string) {
    const source = new FrameString(input)
    return this.lex(source)
  }

  public lex (source: FrameString) {
    return source.reduce(this)
  }

  public finish (_parameter: Frame) {
    const output = FrameSymbol.end()
    const out = this.get(Frame.kOUT)
    out.call(output)
    return this
  }

  public perform (actions: IAction) {
    const parser = this.get(Frame.kOUT) as ParsePipe
    _.forEach(actions, (value, key) => {
      switch (key) {
        case 'semi-next': {
          parser.next(true)
          break
        }
        case 'next': {
          parser.next(false)
          break
        }
        case 'end': {
          parser.finish(value)
          break
        }
        case 'push': {
          const next_parser = parser.push(value)
          this.set(Frame.kOUT, next_parser)
          this.level += 1
          break
        }
        case 'pop': {
          const next_parser = parser.pop(value)
          this.set(Frame.kOUT, next_parser)
          this.level -= 1
          break
        }
      }
    })
    return this
  }
}
