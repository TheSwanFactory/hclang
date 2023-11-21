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
    this.unbind()
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

  public bind(_Factory: any = undefined): Frame {
    return this.push(FrameBind)
  }

  public unbind(): boolean {
    if (this.Factory === FrameBind) {
      this.pop(FrameBind)
      return true
    }
    return false
  }

  public push (Factory: any): Frame {
    const child = new ParsePipe(this, Factory)
    return child
  }

  public pop (Factory: any): Frame {
    const parent = this.get(ParsePipe.kOUT) as ParsePipe
    this.finish(Frame.nil)
    return parent
  }

  public canPop (Factory: any): boolean {
    this.unbind()
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
