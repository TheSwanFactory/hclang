import { Context, Frame, FrameArray, FrameExpr, FrameSymbol } from "../frames";
import { Terminal } from "./terminals";

export class ParsePipe extends FrameArray {
  public collector: Array<Frame>;
  protected factory: any;

  constructor(out: Frame, factory: any) {
    const meta: Context = {};
    meta[ParsePipe.kOUT] = out;
    meta[Frame.kEND] = Terminal.end();
    super([], meta);
    this.factory = factory;
    this.collector = [];
  }
  public next(statement: boolean = false): Frame {
    if (this.length() === 0) {
      return this;
    }
    const term = this.asArray();
    const expr = new FrameExpr(term);
    if (statement) {
      expr.is.statement = true;
    }
    this.collector.push(expr);
    this.reset();
    return this;
  }

  public push(factory: any): Frame {
    const child = new ParsePipe(this, factory);
    return child;
  }

  public pop(factory: any): Frame {
    const parent = this.get(ParsePipe.kOUT) as ParsePipe;
    if (parent.factory !== factory) {
      console.error("mismatched-brackets", parent.factory, factory);
    }
    this.finish(Frame.nil);
    return parent;
  }

  public finish(terminal: any): Frame {
    this.next();
    const out = this.get(Frame.kOUT);
    const value = this.makeFrame();
    const result = out.call(value);
    out.call(terminal);
    return result;
  }

  protected makeFrame() {
    const group = new this.factory(this.collector);
    this.collector = [];
    return group;
  }
}
