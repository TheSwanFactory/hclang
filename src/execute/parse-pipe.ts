import { Context, Frame, FrameArray, FrameBind, FrameExpr } from '../frames.js'
import { IFinish, Terminal } from './terminals.js'

export class ParsePipe extends FrameArray implements IFinish {
  public collector: Array<Frame>
  protected Factory: any

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

  public bind (_Factory: any = undefined): ParsePipe {
    return this.push(FrameBind)
  }

  public unbind (): ParsePipe {
    let next = this as ParsePipe
    while (next.Factory === FrameBind) {
      next = next.pop(FrameBind)
    }
    return next
  }

  public push (Factory: any): ParsePipe {
    const child = new ParsePipe(this, Factory)
    return child
  }

  public pop (Factory: any): ParsePipe {
    const parent = this.get(ParsePipe.kOUT) as ParsePipe
    this.finish(Frame.nil)
    return parent
  }

  public canPop (Factory: any): boolean {
    const match = (this.Factory.name === Factory.name)
    if (!match) {
      console.error(`ParsePipe.canPop.failed: ${Factory.name} cannot pop ${this.Factory.name}`)
    }
    return match
  }

  public finish (terminal: any): Frame {
    this.next()
    const out = this.get(Frame.kOUT)
    const value = this.makeFrame()
    if (value instanceof FrameBind && value.isEmpty()) {
      return out
    }
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
