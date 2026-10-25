import {
  type Context,
  Frame,
  FrameArray,
  FrameBind,
  FrameExpr,
  FrameGroup,
  FrameImport,
  FrameName,
  FrameOperator,
  FrameSchema,
  FrameSymbol,
  type IArrayConstructor,
  type ImportSourceEvaluator,
  type ImportTarget,
} from "../frames.ts";
import { type IFinish, Terminal } from "./terminals.ts";

export type ParsePipeOptions = {
  readonly importSource?: ImportSourceEvaluator;
  readonly emitCompletedForms?: boolean;
  readonly strictStructure?: boolean;
};

export class ParsePipe extends FrameArray implements IFinish {
  public collector: Array<Frame>;
  public readonly strictStructure: boolean;
  protected Factory: IArrayConstructor;
  /** A nested pipe came from source grouping; the root pipe wraps statements. */
  protected readonly nested: boolean;
  /** Whether the source separated this group's terms with `;`. */
  protected sequenced = false;
  private readonly options: ParsePipeOptions;

  constructor(
    out: Frame,
    factory: IArrayConstructor,
    options: ParsePipeOptions = {},
  ) {
    const meta: Context = {};
    meta[ParsePipe.kOUT] = out;
    meta[Frame.kEND] = Terminal.end();
    super([], meta);
    this.Factory = factory;
    this.collector = [];
    this.nested = out instanceof ParsePipe;
    this.options = options;
    this.strictStructure = options.strictStructure ?? false;
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
    this.collector.push(this.importExpression(expr));
    this.reset();

    if (statement && this.emitsCompletedForms()) {
      this.emitCompletedForm();
    }
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
    return new ParsePipe(this, Factory, this.options);
  }

  public pop(_Factory: IArrayConstructor): ParsePipe {
    const parent = this.get(ParsePipe.kOUT) as ParsePipe;
    this.finish(Frame.nil);
    return parent;
  }

  public canPop(Factory: IArrayConstructor): boolean {
    const match = this.Factory.name === Factory.name;
    if (!match && !this.strictStructure) {
      console.error(
        `ParsePipe.canPop.failed: ${Factory.name} cannot pop ${this.Factory.name}`,
      );
    }
    return match;
  }

  public factoryName(): string {
    return this.Factory.name;
  }

  public finish(terminal: Frame): Frame {
    this.next();
    const out = this.get(Frame.kOUT);
    if (this.emitsCompletedForms() && this.collector.length === 0) {
      out.call(terminal);
      return out;
    }

    let value = this.makeFrame();
    if (value instanceof FrameBind) {
      // A bind pipe holds what followed one whitespace. One term is itself:
      // wrapping it added a node with no meaning, which printed as `((x))`
      // and doubled the depth of every walk. Several terms that abut, as in
      // `f o.x`, are one tight expression, evaluated before the term beside
      // it applies, so they stay one `FrameExpr` node. No `FrameBind` reaches
      // the graph (spec a16).
      if (value.isEmpty()) return out;
      const [expr] = value.asArray();
      const term = expr instanceof FrameExpr && expr.size() === 1
        ? expr.asArray()[0]
        : expr;
      // Collected as a token is, by `apply`: `call` would double-dispatch,
      // and a bare symbol or operator answers a call by resolving itself.
      const result = out.apply(term, Frame.nil);
      out.call(terminal);
      return result;
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

  private emitsCompletedForms(): boolean {
    return !this.nested && (this.options.emitCompletedForms ?? false);
  }

  private emitCompletedForm(): void {
    const out = this.get(Frame.kOUT);
    out.call(this.makeFrame());
  }

  private importExpression(expr: FrameExpr): FrameExpr {
    if (this.Factory === FrameBind) return expr;

    let terms = expr.asArray().map(unwrapImportTerm);
    if (
      terms.length === 2 &&
      (terms[1] instanceof FrameBind || terms[1] instanceof FrameExpr)
    ) {
      const remainder = terms[1].asArray().map(unwrapImportTerm);
      if (
        remainder[0] instanceof FrameOperator &&
        remainder[0].operator === "<-"
      ) {
        terms = [terms[0], ...remainder];
      }
    }
    const arrows = terms.filter((term) =>
      term instanceof FrameOperator && term.operator === "<-"
    );
    if (arrows.length === 0) return expr;

    const fail = (): FrameExpr =>
      wrapExpression(
        Frame.error(`$!.resource-import-syntax ${expr.toString()}`),
        expr,
      );
    if (
      arrows.length !== 1 || terms.length !== 3 ||
      !(terms[1] instanceof FrameOperator) ||
      terms[1].operator !== "<-" || this.options.importSource === undefined
    ) {
      return fail();
    }

    let target: ImportTarget;
    if (terms[0] instanceof FrameName && terms[0].source === "") {
      target = { kind: "local" };
    } else if (
      terms[0] instanceof FrameSymbol &&
      Object.getPrototypeOf(terms[0]) === FrameSymbol.prototype
    ) {
      target = { kind: "named", key: terms[0].spelling() };
    } else {
      return fail();
    }

    return wrapExpression(
      new FrameImport(target, terms[2], this.options.importSource),
      expr,
    );
  }
}

function unwrapImportTerm(frame: Frame): Frame {
  let result = frame;
  while (
    (result instanceof FrameBind || result instanceof FrameExpr) &&
    result.size() === 1
  ) {
    result = result.asArray()[0];
  }
  return result;
}

function wrapExpression(value: Frame, source: FrameExpr): FrameExpr {
  const result = new FrameExpr([value]);
  if (source.is.statement === true) result.is.statement = true;
  return result;
}
