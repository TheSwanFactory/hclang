import { inspect } from "node:util";
import { MetaFrame, NilContext } from "./meta-frame.ts";
import { ICurryFunction } from "../ops.ts";
import { IArrayConstructor } from "../frames.ts";

export type Flags = { [key: string]: boolean };

export type Any =
  | null
  | string
  | number
  | bigint
  | boolean
  | Frame
  | Array<Frame>
  | Flags
  | ICurryFunction
  | IArrayConstructor;

export class Frame extends MetaFrame {
  public static readonly kOUT = ">>";
  public static readonly kEND = "$$";
  public static readonly BEGIN_EXPR = "(";
  public static readonly END_EXPR = ")";
  public static readonly nil = new Frame(NilContext, true);
  public static readonly all = new Frame(NilContext, true);

  public static readonly missing: Frame = new Frame(NilContext, false, true);
  public static globals = Frame.missing;

  public is: Flags;

  constructor(meta = NilContext, isNil = false, isMissing = false) {
    super(meta);
    this.up = Frame.missing;
    this.is = {};
    if (isNil) {
      this.is.void = true;
    }
    if (isMissing) {
      this.is.missing = true;
    }
  }

  public string_open() {
    return Frame.BEGIN_EXPR;
  }

  public string_close() {
    return Frame.END_EXPR;
  }

  public at(_index: number) {
    return Frame.nil;
  }

  public in(_contexts = [Frame.nil]): Frame {
    return this;
  }

  public apply(argument: Frame, _parameter: Frame) {
    return argument;
  }

  public called_by(context: Frame, parameter: Frame) {
    if (this.is.void) {
      return context;
    }
    return context.apply(this, parameter);
  }

  public call(argument: Frame, parameter = Frame.nil) {
    if (this.is.void) {
      return argument;
    }
    return argument.called_by(this, parameter);
  }

  public override toString() {
    return this.string_open() + this.meta_string() + this.string_close();
  }

  public className() {
    return this.constructor.name;
  }

  public inspect() {
    let result = `${this.className()}<${this.toString()}>`;
    const meta = this.meta_string();
    if (meta.length > 2) {
      result += meta;
    }
    if (Object.keys(this.is).length > 0) {
      result += `:${inspect(this.is)}`;
    }
    return result;
  }

  public asArray(): Array<Frame> {
    // return _.castArray(this)
    return [this];
  }
}
