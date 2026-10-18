import { MetaFrame } from "./meta-frame.ts";
import { type Context, NilContext } from "./context.ts";
import type { ICurryFunction } from "../ops.ts";
import type { IArrayConstructor } from "../frames.ts";
import type { ScanResponse } from "../scan.ts";
import type { ReceiverState } from "./bound-method.ts";
import type { EvaluationInput } from "./evaluation-scope.ts";

/**
 * Flags map strings to booleans.
 */
export type Flags = { [key: string]: boolean };

/** Named evaluator roots carried by explicit scope references and projections. */
export type EvaluationRoots = {
  fileScope: Frame;
  hostNamespace: Frame;
};

/** A method an aggregate declared as its application, with the key it used. */
export type DeclaredApplication = {
  readonly key: string;
  readonly method: Frame;
};

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

      /**
       * An operation on an error is an error, but collecting is not an
       * operation on the value. A refusal is a value, so an aggregate holds it
       * and reports the failure through its own contents, exactly as it already
       * holds a missing-name note. Preempting a collect would drop the refusal
       * and let the reduce answer as though nothing had gone wrong.
       */
      public override called_by(context: Frame, parameter: Frame): Frame {
        return context.collects() ? context.apply(this, parameter) : this;
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
    this.parent = Frame.missing;
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

  /** Named roots carried by this frame, when it is a scoped projection. */
  public evaluationRoots(): EvaluationRoots | undefined {
    return undefined;
  }

  /** Lexical continuation for values projected through this frame. */
  public projectionContext(): Frame {
    return this;
  }

  public in(_scope: EvaluationInput = []): Frame {
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
  public call(
    argument: Frame,
    parameter = Frame.nil,
    _receiverState?: ReceiverState,
  ): Frame {
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

  /**
   * typeEquals is `==`: the same value, and the same type at every node.
   * It is strictly stronger than `equals`, so `3 == 3.0` is nil while
   * `3 = 3.0` holds.
   */
  public typeEquals(other: Frame): Frame {
    const left = this.referent();
    const right = other.referent();
    return left.constructor === right.constructor
      ? left.equals(right)
      : Frame.nil;
  }

  /**
   * identical is `===`: whether both references reach the same frame.
   *
   * Only a frame that owns identity can be told apart from an equal copy.
   * Atoms and closure bodies are shared by the copy contract, so sharing them
   * is unobservable and identity falls back to `typeEquals`, which keeps the
   * ladder monotone: `===` implies `==` implies `=`. No id is ever exposed.
   */
  public identical(other: Frame): Frame {
    const left = this.referent();
    const right = other.referent();
    if (left.ownsIdentity()) return left === right ? Frame.all : Frame.nil;
    return left.typeEquals(right);
  }

  /** The frame a reference reaches. A handle answers its target. */
  public referent(): Frame {
    return this;
  }

  /** Whether a write can land on this frame, so that identity is observable. */
  public ownsIdentity(): boolean {
    return false;
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
   * asArray returns this aggregate's own terms.
   *
   * This is structural access, not the enumerable protocol: the parser, lazy
   * frames, and the schema matchers ask a frame for the terms it is built from.
   * Iteration asks `elements`, which a stream answers by producing content it
   * does not hold. Keeping the two apart is what lets a resource enumerate
   * characters without every structural walk performing a read.
   *
   * The default implementation is to return this frame inside an Array.
   * @returns an array of Frames
   */
  public asArray(): Array<Frame> {
    // return _.castArray(this)
    return [this];
  }

  /**
   * Whether applying to this frame collects the argument rather than consuming it.
   *
   * Only an aggregate answers yes. The distinction matters for one argument: an
   * error preempts application everywhere else, because an operation on an error
   * is an error, and a collect is not such an operation.
   */
  public collects(): boolean {
    return false;
  }

  /**
   * The receiver a collect lands on when it must not write this frame.
   *
   * A literal is a fresh aggregate each time it is evaluated, so collecting
   * into it in place is unobservable. A value reached through a name is not,
   * so the name asks for this instead. Anything that does not collect is its
   * own receiver.
   */
  public collectingCopy(): Frame {
    return this;
  }

  /**
   * Hands a result to this frame as the interpreter's output, not as an
   * application written in the program.
   *
   * The evaluator's output array is also the file scope, where top-level
   * declarations land, so a program can declare an application on it (#375).
   * Collecting output must not run that declaration, so an aggregate collects
   * here unconditionally. Any other output receiver, such as a test harness,
   * is applied as usual.
   */
  public collect(value: Frame, context: Frame = Frame.nil): Frame {
    return this.apply(value, context);
  }

  /**
   * The method this frame declares as its own application, if any.
   *
   * Only an aggregate can declare one, so the base answers none. See
   * `FrameArray.applicationMethod` for the protocol.
   */
  public applicationMethod(): DeclaredApplication | undefined {
    return undefined;
  }

  /**
   * What this frame contributes when text receives it (#398).
   *
   * A frame contributes itself, so text takes its characters or its spelling.
   * An aggregate may declare `toText` to answer something more readable; see
   * `FrameArray.toText`.
   */
  public toText(): Frame {
    return this;
  }

  /**
   * The values this frame streams when it is iterated.
   *
   * Anything which is not an aggregate is a single element, so text does not
   * enumerate its characters. An aggregate answers its elements; a stream, such
   * as a resource, answers content it produces on demand.
   */
  public elements(): Array<Frame> {
    return [this];
  }

  /**
   * Property names a caller can see, in declaration order.
   *
   * Only the doubled operators widen a stream to properties, so this is the one
   * place that decides what "visible" means for iteration: the public spellings
   * a program declared, without the interpreter's own plumbing, the schema
   * written beside a declaration, the lookup patterns, or the graded spellings
   * whose logical name is only reachable through authorization.
   */
  public visibleKeys(): string[] {
    return this.meta_keys().filter((key) =>
      key !== Frame.kOUT &&
      !key.startsWith("_") &&
      !key.endsWith(".<>") &&
      !/^\/.*\/$/.test(key)
    );
  }

  /**
   * Folds this frame's stream into a receiver, one element at a time.
   *
   * The receiver is supplied rather than fixed, and each element is applied to
   * the value accumulated so far, so what a reduce answers is decided by what
   * the receiver does when applied: text joins, an aggregate collects, a
   * numeric multiplies. Granularity is therefore a property of the composition
   * and never of the source, which is why no source has to declare an element
   * type. Nothing is materialized on the receiver's behalf.
   *
   * An empty stream answers the receiver it started from. The receiver is the
   * accumulator before any element arrives, so a fold over nothing is that
   * accumulator: an empty collect is `[]`, an empty join `“”`, an empty product
   * `1`. This is what keeps a reduce compositional, since folding a whole stream
   * must equal folding its first part and continuing from that answer, even
   * when the first part is empty.
   */
  public reduce(receiver: Frame, receiverState?: ReceiverState): Frame {
    return Frame.reduceInto(this.elements(), receiver, receiverState);
  }

  /** Threads one stream through a receiver, answering the receiver for an empty one. */
  public static reduceInto(
    values: readonly Frame[],
    receiver: Frame,
    receiverState?: ReceiverState,
  ): Frame {
    if (values.length === 0) {
      return receiver;
    }
    return values.reduce(
      (accumulator, value) => accumulator.call(value, Frame.nil, receiverState),
      receiver,
    );
  }

  /**
   * Whether this frame is a failed result at a control boundary.
   *
   * An aggregate of operation results fails when one immediate element is an
   * error. This is deliberately shallow: nested error-valued arrays remain
   * ordinary values unless they are themselves the result being controlled.
   *
   * This asks the structural view rather than the enumerable one, because a
   * control boundary checks every term of every statement: enumerating here
   * would make a stream perform its read once per mention.
   */
  public isFailedResult(): boolean {
    return this.is.error === true ||
      this.asArray().some((result) => result.is.error === true);
  }

  /**
   * The plumbing copy: a shallow clone with an independent metadata map, flags,
   * and id, for interpreter internals that need those and nothing more. It
   * makes no object-semantic promise, so callers must not treat it as one;
   * `instanceCopy` is the operation with object semantics.
   */
  public copy(): this {
    const clone = Object.create(Object.getPrototypeOf(this)) as this;
    Object.assign(clone, this);
    clone.meta = this.meta_copy();
    clone.is = { ...this.is };
    clone.id = `$:${this.className()}.${MetaFrame.id_count++}`;
    return clone;
  }

  /**
   * The instance copy: the object-semantic operation, taken when copy-on-write
   * shields an immutable receiver from a mutating method. Atoms are immutable
   * and closures are shared bodies, so for them sharing is unobservable and the
   * default is to share. Aggregates own identity, so `FrameArray` overrides this
   * to hand back a fresh aggregate whose members are still shared (#401).
   */
  public instanceCopy(): Frame {
    return this;
  }

  /**
   * Replaces a member that is exactly `member` with `replacement`, answering
   * whether one was found. Copy-on-write uses it to install a copy of a member
   * into the copy that holds it, so only declared slots are searched here.
   */
  public replaceMember(member: Frame, replacement: Frame): boolean {
    let replaced = false;
    for (const [key, value] of this.meta_pairs()) {
      if (value === member) {
        this.meta[key] = replacement;
        replaced = true;
      }
    }
    return replaced;
  }

  /**
   * Negation is decided by the symbol's name, never by how it prints.
   *
   * `().!` evaluates its name to a symbol in value position, which renders with
   * the address dot, so comparing printed forms would stop recognizing it. The
   * class check is what makes the structural read below safe; frame.ts cannot
   * import the symbol module without closing a cycle through its own base.
   */
  private static isBooleanNegation(argument: Frame): boolean {
    return argument.className() === "FrameSymbol" &&
      (argument as unknown as { spelling(): string }).spelling() === "!";
  }
}
