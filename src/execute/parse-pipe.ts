import { Context, Frame, FrameArray, FrameBind, FrameExpr } from "../frames.ts";
import { IFinish, Terminal } from "./terminals.ts";

export type ParseFactory = { new (data: Array<Frame>): Frame };

export class ParsePipe extends FrameArray implements IFinish {
  public collector: Array<Frame>;
  protected Factory: ParseFactory;

  constructor(out: Frame, factory: ParseFactory) {
    const meta: Context = {};
    meta[ParsePipe.kOUT] = out;
    meta[Frame.kEND] = Terminal.end();
    super([], meta);
    this.Factory = factory;
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

  public bind(_Factory: ParseFactory | undefined = undefined): ParsePipe {
    return this.push(FrameBind);
  }

  public unbind(): ParsePipe {
    let next = this as ParsePipe;
    while (next.Factory === FrameBind) {
      next = next.pop(FrameBind);
    }
    return next;
  }

  public push(Factory: ParseFactory): ParsePipe {
    const child = new ParsePipe(this, Factory);
    return child;
  }

  public pop(_Factory: ParseFactory): ParsePipe {
    const parent = this.get(ParsePipe.kOUT) as ParsePipe;
    this.finish(Frame.nil);
    return parent;
  }

  public canPop(Factory: ParseFactory): boolean {
    const match = this.Factory.name === Factory.name;
    if (!match) {
      console.error(
        `ParsePipe.canPop.failed: ${Factory.name} cannot pop ${this.Factory.name}`,
      );
    }
    return match;
  }

  public finish(terminal: Frame): Frame {
    this.next();
    const out = this.get(Frame.kOUT);
    const value = this.makeFrame();
    if (value instanceof FrameBind && value.isEmpty()) {
      return out;
    }
    const result = out.call(value);
    out.call(terminal);
    return result;
  }

  protected makeFrame() {
    const group = new this.Factory(this.collector);
    this.collector = [];
    return group;
  }
}
