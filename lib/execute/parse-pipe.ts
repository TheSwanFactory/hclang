import {
  type Context,
  Frame,
  FrameArray,
  FrameBind,
  FrameExpr,
  FrameGroup,
  FrameSchema,
  type IArrayConstructor,
} from "../frames.ts";
import { type IFinish, Terminal } from "./terminals.ts";

export class ParsePipe extends FrameArray implements IFinish {
  public collector: Array<Frame>;
  protected Factory: IArrayConstructor;
  /** A nested pipe came from source grouping; the root pipe wraps statements. */
  protected readonly nested: boolean;
  /** Whether the source separated this group's terms with `;`. */
  protected sequenced = false;

  constructor(out: Frame, factory: IArrayConstructor) {
    const meta: Context = {};
    meta[ParsePipe.kOUT] = out;
    meta[Frame.kEND] = Terminal.end();
    super([], meta);
    this.Factory = factory;
    this.collector = [];
    this.nested = out instanceof ParsePipe;
  }

  public next(statement: boolean = false): ParsePipe {
    if (statement) {
      // Writing the separator is the author's intent to sequence, whether or
      // not it also terminated a nonempty term. Recording it here is what lets
      // a closure body be evaluated by intent rather than by inspecting flags
      // on its children.
      this.sequenced = true;
    }
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

  public bind(_Factory: IArrayConstructor | undefined = undefined): ParsePipe {
    return this.push(FrameBind);
  }

  public unbind(): ParsePipe {
    let next = this as ParsePipe;
    while (next.Factory === FrameBind) {
      next = next.pop(FrameBind);
    }
    return next;
  }

  public push(Factory: IArrayConstructor): ParsePipe {
    const child = new ParsePipe(this, Factory);
    return child;
  }

  public pop(_Factory: IArrayConstructor): ParsePipe {
    const parent = this.get(ParsePipe.kOUT) as ParsePipe;
    this.finish(Frame.nil);
    return parent;
  }

  public canPop(Factory: IArrayConstructor): boolean {
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
    let value = this.makeFrame();
    if (value instanceof FrameBind && value.isEmpty()) {
      return out;
    }
    if (value instanceof FrameSchema && value.isEmpty()) {
      value = Frame.all;
    }
    const result = out.call(value);
    out.call(terminal);
    return result;
  }

  protected makeFrame(): Frame {
    const group = new this.Factory(this.collector, {});
    // A group written in the source accepts declarations. A statement wrapper
    // exists only to group, so it never claims to be a declaration target.
    if (this.nested && group instanceof FrameGroup) {
      group.declares = true;
    }
    if (this.sequenced) {
      group.is.sequence = true;
    }
    this.collector = [];
    this.sequenced = false;
    return group;
  }
}
