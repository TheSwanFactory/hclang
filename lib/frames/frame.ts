import { MetaFrame } from "./meta-frame.ts";
import { NilContext } from "./context.ts";
import type { ICurryFunction } from "../ops.ts";
import type { IArrayConstructor } from "../frames.ts";

/**
 * Flags map strings to booleans.
 */
export type Flags = { [key: string]: boolean };

/**
 * inspectFlags returns a string representation of the Flags.
 *
 * @param flags
 * @returns
 */
export function inspectFlags(flags: Flags): string {
  const entries = Object.entries(flags);
  if (entries.length === 0) {
    return "{}";
  }
  const result = entries.map(([key, value]) => `  ${key}: ${value}`).join(
    ",\n",
  );
  return `{\n${result}\n}`;
}

/**
 * The `Any` type represents a value that can be primitives or Frames
 * (used primarily for parsing).
 */
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

/**
 * The `Frame` class represents a instantiable frame in the system.
 * It extends the `MetaFrame` class and provides methods for
 * manipulating and interacting with frames.
 */
export class Frame extends MetaFrame {
  /**
   * kOUT is where the Frame writes output when evaluated.
   */
  public static readonly kOUT = ">>";
  /**
   * kEND is the symbol for the end of a FrameList.
   */
  public static readonly kEND = "$$";
  /**
   * BEGIN_EXPR is the symbol for the beginning of an expression.
   */
  public static readonly BEGIN_EXPR = "(";
  /**
   * END_EXPR is the symbol for the end of an expression.
   */
  public static readonly END_EXPR = ")";
  /**
   * nil is the singleton Frame '()' that represents the empty expression (false)
   */
  public static readonly nil: Frame = new Frame(NilContext, true);
  /**
   * all is the singleton Frame '<>' that represents the total type (true).
   */

  public static readonly all: Frame = new (class extends Frame {
    override toString() {
      return "<>";
    }
  })();

  /**
   * missing is the singleton Frame '()' that represents undefined values.
   */
  public static readonly missing: Frame = new Frame(NilContext, false, true);

  /**
   * globals is the top of the lookup chain.
   *
   * It will be set to the Ops object for global operators.
   */
  public static globals: Frame = Frame.missing;

  /**
   * is captures Flags for this Frame.
   */
  public is: Flags;

  /**
   * Frames are instantiated with a meta Context.
   * They can also be explicitly declared as nil or missing.
   */
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

  /**
   * string_open tells the parser which string can begin this Frame.
   */
  public string_open(): string {
    return Frame.BEGIN_EXPR;
  }

  /**
   * string_close tells the parser which string can end this Frame.
   */
  public string_close(): string {
    return Frame.END_EXPR;
  }

  /**
   * at returns the Frame at the given index (for FrameLists)
   *
   * @param _index
   * @returns a Frame or Frame.nil
   */

  public at(_index: number): Frame {
    return Frame.nil;
  }

  /**
   * in determines how the Frame is evaluated in the given contexts.
   *
   * @param _contexts
   * @returns a Frame or Frame.nil
   */

  public in(_contexts = [Frame.nil]): Frame {
    return this;
  }

  /**
   * apply returns the Frame as the result of evaluation
   * with the given argument (and optional parameter)
   *
   * @param argument
   * @param _parameter
   * @returns a Frame
   */

  public apply(argument: Frame, _parameter: Frame): Frame {
    return argument;
  }

  /**
   * called_by defautls to reversing the double-dispatch
   * and just applies the original Frame to this argument.
   *
   * @param context
   * @param _parameter
   * @returns a Frame
   */

  public called_by(context: Frame, parameter: Frame): Frame {
    if (this.is.void) {
      return context;
    }
    return context.apply(this, parameter);
  }

  /**
   * call is used to perform double-dispatch
   * to allow arguments to specify how the Frame should be evaluated.
   *
   * @param argument
   * @param parameter
   * @returns a Frame
   */
  public call(argument: Frame, parameter = Frame.nil): Frame {
    if (this.is.void) {
      return argument;
    }
    return argument.called_by(this, parameter);
  }

  /**
   * toString returns the string representation of the Frame
   * The default implementation is to return the meta_string
   * inside the string_open and string_close.
   * @returns a string
   */
  public override toString(): string {
    return this.string_open() + this.meta_string() + this.string_close();
  }

  /**
   * equals compares two Frames for equality.
   * The default implementation is to compare their string representation.
   * @param other
   * @returns either Frame.all (true) or Frame.nil (false)
   */
  public equals(other: Frame): Frame {
    return this.toString() === other.toString() ? Frame.all : Frame.nil;
  }

  /**
   * isEqualTo compares two Frames for equality using 'equals'
   * It converts the result to a boolean.
   *
   * @param other
   * @returns true if the two Frames are equal, else false
   */

  public isEqualTo(other: Frame): boolean {
    return this.equals(other) === Frame.all;
  }

  /**
   * className returns the name of the class as a string.
   * @returns a string
   */
  public className(): string {
    return this.constructor.name;
  }

  /**
   * inspect returns a string representation of the Frame
   * suitable for debugging.
   * @returns a string
   */
  public inspect(): string {
    let result = `${this.className()}<${this.toString()}>`;
    const meta = this.meta_string();
    if (meta.length > 2) {
      result += meta;
    }
    if (Object.keys(this.is).length > 0) {
      result += `:${inspectFlags(this.is)}`;
    }
    return result;
  }

  /**
   * asArray returns the Frame as an array of Frames.
   * This is used to allow Frames to be passed to functions
   * that expect arrays.
   *
   * The default implementation is to return this frame inside an Array.
   * @returns an array of Frames
   */
  public asArray(): Array<Frame> {
    // return _.castArray(this)
    return [this];
  }
}
