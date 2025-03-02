import {
  type Context,
  Frame,
  FrameArray,
  FrameBind,
  FrameExpr,
  FrameSchema,
  type IArrayConstructor,
} from "../frames.ts";
import { type IFinish, Terminal } from "./terminals.ts";

/**
 * The `ParsePipe` class extends `FrameArray` and implements the `IFinish` interface.
 * It is used to parse and collect frames, allowing for the construction of complex frame structures.
 *
 * @extends FrameArray
 * @implements IFinish
 */
export class ParsePipe extends FrameArray implements IFinish {
  public collector: Array<Frame>;
  protected Factory: IArrayConstructor;

  /**
   * @constructor
   * @param {Frame} out - The output frame.
   * @param {IArrayConstructor} factory - The factory for creating frame arrays.
   */
  constructor(out: Frame, factory: IArrayConstructor) {
    const meta: Context = {};
    meta[ParsePipe.kOUT] = out;
    meta[Frame.kEND] = Terminal.end();
    super([], meta);
    this.Factory = factory;
    this.collector = [];
  }

  /**
   * @method next
   * @param {boolean} [statement=false] - Indicates if the frame is a statement.
   * @returns {ParsePipe} - Returns the current instance of `ParsePipe`.
   */
  public next(statement: boolean = false): ParsePipe {
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

  /**
   * @method bind
   * @param {IArrayConstructor} [_Factory=undefined] - The factory for creating frame arrays.
   * @returns {ParsePipe} - Returns the current instance of `ParsePipe`.
   */
  public bind(_Factory: IArrayConstructor | undefined = undefined): ParsePipe {
    return this.push(FrameBind);
  }

  /**
   * @method unbind
   * @returns {ParsePipe} - Returns the current instance of `ParsePipe`.
   */
  public unbind(): ParsePipe {
    let next = this as ParsePipe;
    while (next.Factory === FrameBind) {
      next = next.pop(FrameBind);
    }
    return next;
  }

  /**
   * @method push
   * @param {IArrayConstructor} Factory - The factory for creating frame arrays.
   * @returns {ParsePipe} - Returns a new instance of `ParsePipe`.
   */
  public push(Factory: IArrayConstructor): ParsePipe {
    const child = new ParsePipe(this, Factory);
    return child;
  }

  /**
   * @method pop
   * @param {IArrayConstructor} _Factory - The factory for creating frame arrays.
   * @returns {ParsePipe} - Returns the parent instance of `ParsePipe`.
   */
  public pop(_Factory: IArrayConstructor): ParsePipe {
    const parent = this.get(ParsePipe.kOUT) as ParsePipe;
    this.finish(Frame.nil);
    return parent;
  }

  /**
   * @method canPop
   * @param {IArrayConstructor} Factory - The factory for creating frame arrays.
   * @returns {boolean} - Returns true if the factory can pop, otherwise false.
   */
  public canPop(Factory: IArrayConstructor): boolean {
    const match = this.Factory.name === Factory.name;
    if (!match) {
      console.error(
        `ParsePipe.canPop.failed: ${Factory.name} cannot pop ${this.Factory.name}`,
      );
    }
    return match;
  }

  /**
   * @method finish
   * @param {Frame} terminal - The terminal frame.
   * @returns {Frame} - Returns the result frame.
   */
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

  /**
   * @protected
   * @method makeFrame
   * @returns {Frame} - Returns a new frame created by the factory.
   */
  protected makeFrame(): Frame {
    const group = new this.Factory(this.collector, {});
    this.collector = [];
    return group;
  }
}
