import { MetaFrame } from "./meta-frame.ts";
import { type Context, NilContext } from "./context.ts";
import type { ICurryFunction } from "../ops.ts";
import type { IArrayConstructor } from "../frames.ts";
import type { ScanResponse } from "../scan.ts";

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
    override toString(): string {
      return "<>";
    }

    override dataString(): string {
      return "<>";
    }

    override call(argument: Frame): Frame {
      return Frame.isBooleanNegation(argument) ? Frame.nil : this;
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

  /** Creates a runtime error value without coupling MetaFrame to FrameNote. */
  public static error(source: string): Frame {
    const error = new (class extends Frame {
      public override toString(): string {
        return source;
      }

      public override dataString(): string {
        return source;
      }

      public override call(_argument: Frame): Frame {
        return this;
      }

      public override called_by(_context: Frame): Frame {
        return this;
      }
    })();
    error.is.error = true;
    return error;
  }

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
      return Frame.isBooleanNegation(argument) ? Frame.all : argument;
    }
    return argument.called_by(this, parameter);
  }

  /**
   * Advances an active lexical receiver by one Symbol.
   *
   * Non-lexical Frames retain the historical double-dispatch behavior. The
   * optional source is supplied only to syntax participants adapted by Lex.
   */
  public scan(
    argument: Frame,
    _source = "",
    _context: Frame = Frame.nil,
  ): ScanResponse {
    return this.call(argument);
  }

  /** Resolves this receiver at physical end-of-input. */
  public finishInput(_source = ""): ScanResponse {
    return this;
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

  /** Compare only this frame's data plane, excluding metadata. */
  public dataEquals(other: Frame): Frame {
    return this.dataString() === other.dataString() ? Frame.all : Frame.nil;
  }

  /** Compare only this frame's metadata plane, excluding data. */
  public metadataEquals(other: Frame): Frame {
    const leftMeta = this.metadataView();
    const rightMeta = other.metadataView();
    const keys = new Set([
      ...Object.keys(leftMeta),
      ...Object.keys(rightMeta),
    ]);
    for (const key of keys) {
      const left = leftMeta[key];
      const right = rightMeta[key];
      if (!left || !right || !left.isEqualTo(right)) {
        return Frame.nil;
      }
    }
    return Frame.all;
  }

  /** Returns the live metadata plane used by metadata equality. */
  public metadataView(): Context {
    return this.meta;
  }

  /** Stable representation of the data plane used by data equality. */
  public dataString(): string {
    return this.string_open() + this.string_close();
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

  /** Returns a shallow frame copy with an independent metadata context. */
  public copy(): this {
    const clone = Object.create(Object.getPrototypeOf(this)) as this;
    Object.assign(clone, this);
    clone.meta = this.meta_copy();
    clone.is = { ...this.is };
    clone.id = `$:${this.className()}.${MetaFrame.id_count++}`;
    return clone;
  }

  private static isBooleanNegation(argument: Frame): boolean {
    return argument.className() === "FrameSymbol" &&
      argument.toString() === "!";
  }
}
