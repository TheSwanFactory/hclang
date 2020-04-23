import { Context, Frame, FrameArray, FrameExpr, FrameSymbol } from '../frames'
import { IFinish, Terminal } from './terminals'

export class ParsePipe extends FrameArray implements IFinish {
  public collector: Array<Frame>;
  protected Factory: any;

  constructor (out: Frame, factory: any) {
    const meta: Context = {}
    meta[ParsePipe.kOUT] = out
    meta[Frame.kEND] = Terminal.end()
    super([], meta)
    this.Factory = factory
    this.collector = []
  }

  public next (statement: boolean = false): Frame {
    if (this.length() === 0) {
      return this
    }
    const term = this.asArray()
    const expr = new FrameExpr(term)
    if (statement) {
      expr.is.statement = true
    }
    this.collector.push(expr)
    this.reset()
    return this
  }

  public push (Factory: any): Frame {
    const child = new ParsePipe(this, Factory)
    return child
  }

  public pop (Factory: any): Frame {
    const parent = this.get(ParsePipe.kOUT) as ParsePipe
    if (parent.Factory !== Factory) {
      const msg = ['open:', parent.Factory, ' close:', Factory]
      // console.error("pop.mismatched-brackets " + msg.join(""));
    }
    this.finish(Frame.nil)
    return parent
  }

  public finish (terminal: any): Frame {
    this.next()
    const out = this.get(Frame.kOUT)
    const value = this.makeFrame()
    const result = out.call(value)
    out.call(terminal)
    return result
  }

  protected makeFrame () {
    const group = new this.Factory(this.collector)
    this.collector = []
    return group
  }
}
