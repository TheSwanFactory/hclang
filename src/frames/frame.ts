import { MetaFrame } from "./meta-frame.ts";
import { NilContext } from "./meta-frame.ts";
import type { ICurryFunction } from "../ops.ts";
import type { IArrayConstructor } from "../frames.ts";

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
  public static readonly nil: Frame = new Frame(NilContext, true);
  public static readonly all: Frame = new (class extends Frame {
    override toString() {
      return "<>";
    }
  })();

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

  public string_open(): string {
    return Frame.BEGIN_EXPR;
  }

  public string_close(): string {
    return Frame.END_EXPR;
  }

  public at(_index: number): Frame {
    return Frame.nil;
  }

  public in(_contexts = [Frame.nil]): Frame {
    return this;
  }

  public apply(argument: Frame, _parameter: Frame): Frame {
    return argument;
  }

  public called_by(context: Frame, parameter: Frame): Frame {
    if (this.is.void) {
      return context;
    }
    return context.apply(this, parameter);
  }

  public call(argument: Frame, parameter = Frame.nil): Frame {
    if (this.is.void) {
      return argument;
    }
    return argument.called_by(this, parameter);
  }

  public override toString(): string {
    return this.string_open() + this.meta_string() + this.string_close();
  }

  public className(): string {
    return this.constructor.name;
  }

  public inspect(): string {
    let result = `${this.className()}<${this.toString()}>`;
    const meta = this.meta_string();
    if (meta.length > 2) {
      result += meta;
    }
    if (Object.keys(this.is).length > 0) {
      result += `:${Deno.inspect(this.is)}`;
    }
    return result;
  }

  public asArray(): Array<Frame> {
    // return _.castArray(this)
    return [this];
  }
}
