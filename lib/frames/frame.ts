import { type Context, type IKeyValuePair, NilContext } from "./context.ts";
import { renderNested } from "./stringify.ts";
import type { FrameName } from "./frame-name.ts";
import type { FrameSymbol } from "./frame-symbol.ts";
import type { FrameSchema } from "./frame-schema.ts";
import type { FrameLazy } from "./frame-lazy.ts";
import type { ICurryFunction } from "../ops.ts";
import type { IArrayConstructor } from "../frames.ts";
import type { ScanResponse } from "../scan.ts";
import type { ReceiverState } from "./bound-method.ts";
import type { EvaluationInput, EvaluationScope } from "./evaluation-scope.ts";

/**
 * ISourced is a Frame with a source property.
 */
export interface ISourced extends Frame {
  /**
   * source is the source string.
   */
  source: string;
}

/** A logical lookup resolved to its physical declaration owner, key, and value. */
export type BindingResolution = {
  owner: MetaFrame;
  key: string;
  value: Frame;
};

/** Visibility levels for logical frame bindings. */
export enum Visibility {
  Public = "public",
  Protected = "protected",
  Private = "private",
}

/**
 * MetaFrame is the parent class of Frame, providing methods for managing metadata.
 */
export class MetaFrame {
  /**
   * Checks if the given string is numeric
   * (to distinguish array indices from metadata keys)
   *
   * @param {string} value - The string to check.
   * @returns {boolean} `true` if the string is all numeric, `false` otherwise.
   */
  public static isInteger(value: string): boolean {
    return /^\p{N}+$/u.test(value);
  }

  /**
   * Checks if the given character is alphabetic.
   *
   * @param {string} char - The character to check.
   * @returns {boolean} `true` if the character is alphabetic, `false` otherwise.
   */
  public static isAlphabetic(char: string): boolean {
    return /\p{L}/u.test(char);
  }

  /**
   * id_count is a static counter, incremented to generate unique IDs.
   */
  public static id_count = 0;

  /**
   * up is the lexical parent carried by structurally nested frames and
   * per-read plumbing copies. Symbol lookup never rewrites it on a shared
   * value; identity-bearing values carry reader context in a FrameHandle.
   */
  public up: Frame = {} as Frame; // forward-declare Frame

  /**
   * parent is the declared parent: the explicit `.^` inheritance link.
   * It is written only by setParent, so the declared chain is acyclic by
   * construction, and it is the only chain visibility authorizes against.
   */
  public parent: Frame = {} as Frame; // forward-declare Frame

  /** Typed receiver capability installed only on an invocation frame. */
  public receiverState?: ReceiverState;

  /**
   * declares marks a frame that accepts declarations, so a name binds to the
   * innermost marked target instead of inferring one from context classes.
   */
  public declares = false;

  /**
   * id is a unique identifier for each Frame.
   */
  public id: string;

  /**
   * meta is a map of key-value pairs for the Frame.
   * _isNil is a flag indicating if the Frame is nil.
   */
  constructor(public meta: Context = NilContext, _isNil = false) {
    const name = this.constructor.name;
    const id = name + "." + MetaFrame.id_count++;
    this.id = "$:" + id;
  }

  /**
   * get_here retrieves a Frame by key from the current context.
   */
  public get_here(key: string, _origin: MetaFrame = this): Frame {
    const exact = this.resolve_here(key, _origin);
    if (exact != null) {
      return exact.value;
    }
    return this.match_here(key);
  }

  /** Lets a projection perform another frame's local lookup without its links. */
  protected lookup_here_on(
    frame: MetaFrame,
    key: string,
    origin: MetaFrame,
  ): Frame {
    return frame.lookup_here(key, origin);
  }

  /**
   * Lets a forwarding link search another frame's non-global lookup graph.
   *
   * `Frame.globals` stays the one final tier of the outer `get`, which
   * curries an operator with that lookup's own origin; a forwarded `get`
   * would reach the globals early, from the wrong frame.
   */
  protected lookup_graph_on(
    frame: MetaFrame,
    key: string,
    origin: MetaFrame,
  ): Frame {
    return MetaFrame.lookup(frame, key, origin, new Set<MetaFrame>());
  }

  /**
   * Lets a forwarding link resolve a binding through another frame's
   * non-global graph.
   *
   * The binding counterpart of `lookup_graph_on`, with the same tiers, so a
   * forwarded value and its binding metadata come from the same declaration
   * owner. `Frame.globals` stays the one final tier of the outer `resolve`.
   */
  protected resolve_graph_on(
    frame: MetaFrame,
    key: string,
    origin: MetaFrame,
  ): BindingResolution | undefined {
    return MetaFrame.resolveBinding(frame, key, origin, new Set<MetaFrame>());
  }

  /** Resolves a logical name to the declaration key visible from origin. */
  public resolve_here(
    key: string,
    origin: MetaFrame = this,
  ): BindingResolution | undefined {
    if (key.startsWith("__")) {
      return this.authorize(
        key,
        Visibility.Private,
        key.slice(2),
        origin,
      );
    }
    if (key.startsWith("_")) {
      return this.authorize(
        key,
        Visibility.Protected,
        key.slice(1),
        origin,
      );
    }

    const publicValue = this.meta[key];
    if (publicValue != null) {
      return { owner: this, key, value: publicValue };
    }
    return this.authorize(
      `_${key}`,
      Visibility.Protected,
      key,
      origin,
    ) ??
      this.authorize(
        `__${key}`,
        Visibility.Private,
        key,
        origin,
      );
  }

  /** Resolves a binding through the same guarded graph as ordinary lookup. */
  public resolve(
    key: string,
    origin: MetaFrame = this,
  ): BindingResolution | undefined {
    const local = this.resolve_here(key, origin);
    if (local) return local;

    const seen = new Set<MetaFrame>([this]);
    for (const link of this.lookup_links()) {
      const result = MetaFrame.resolveBinding(link, key, origin, seen);
      if (result) return result;
    }

    const globals = Frame.globals;
    if (globals && !globals.is.missing && !seen.has(globals)) {
      return MetaFrame.resolveBinding(globals, key, origin, seen);
    }
    return undefined;
  }

  /**
   * Get a frame by key through one guarded lookup traversal.
   *
   * Subclasses customize only local lookup, links, and successful-result
   * transformation. The traversal itself stays here so a virtual override
   * cannot accidentally discard cycle state. Declared parents precede lexical
   * scope, and globals are consulted once after the complete scope graph.
   */
  public get(key: string, origin: MetaFrame = this): Frame {
    const local = this.lookup_here(key, origin);
    if (!local.is.missing) {
      return this.lookup_result(local, key);
    }

    // Allocate traversal state only after an immediate local miss.
    const seen = new Set<MetaFrame>([this]);
    for (const link of this.lookup_links()) {
      const result = MetaFrame.lookup(link, key, origin, seen);
      if (!result.is.missing) {
        return this.lookup_result(result, key);
      }
    }

    // Globals are the final lookup tier, even when the lexical graph cycles.
    const globals = Frame.globals;
    if (globals && !globals.is.missing && !seen.has(globals)) {
      const result = MetaFrame.lookup(globals, key, origin, seen);
      if (!result.is.missing) {
        return this.lookup_result(result, key);
      }
    }
    return Frame.missing;
  }

  /** Local behavior used by the guarded lookup driver. */
  protected lookup_here(key: string, origin: MetaFrame): Frame {
    return this.get_here(key, origin);
  }

  /** Non-global links in lookup precedence order. */
  protected lookup_links(): Frame[] {
    const links: Frame[] = [];
    if (this.parent && !this.parent.is.missing) {
      links.push(this.parent);
    }
    if (
      this.up && !this.up.is.missing && this.up !== Frame.globals
    ) {
      links.push(this.up);
    }
    return links;
  }

  /** Allows wrappers to transform a value found anywhere below them. */
  protected lookup_result(result: Frame, _key: string): Frame {
    return result;
  }

  /** Depth-first declared-before-lexical traversal without global fallback. */
  private static lookup(
    frame: MetaFrame,
    key: string,
    origin: MetaFrame,
    seen: Set<MetaFrame>,
  ): Frame {
    if (seen.has(frame)) {
      return Frame.missing;
    }
    seen.add(frame);

    const local = frame.lookup_here(key, origin);
    if (!local.is.missing) {
      return frame.lookup_result(local, key);
    }
    for (const link of frame.lookup_links()) {
      const result = MetaFrame.lookup(link, key, origin, seen);
      if (!result.is.missing) {
        return frame.lookup_result(result, key);
      }
    }
    return Frame.missing;
  }

  /** Depth-first binding traversal without global fallback. */
  private static resolveBinding(
    frame: MetaFrame,
    key: string,
    origin: MetaFrame,
    seen: Set<MetaFrame>,
  ): BindingResolution | undefined {
    if (seen.has(frame)) return undefined;
    seen.add(frame);

    const local = frame.resolve_here(key, origin);
    if (local) return local;
    for (const link of frame.lookup_links()) {
      const result = MetaFrame.resolveBinding(link, key, origin, seen);
      if (result) return result;
    }
    return undefined;
  }

  /**
   * set adds a new key-value pair to the current context.
   */
  public set(key: string, value: Frame): MetaFrame {
    if (this.meta === NilContext) {
      this.meta = {};
    }
    this.meta[key] = value;
    return this;
  }

  /** Whether this frame carries an explicitly declared parent. */
  public hasDeclaredParent(): boolean {
    return this.parent != null && !this.parent.is.missing;
  }

  /**
   * setParent is the only path that may attach a declared parent, so a cyclic
   * declared chain cannot be built by a caller that forgot to check. It returns
   * an error frame when the link is refused and undefined when it is accepted.
   */
  public setParent(parent: Frame): Frame | undefined {
    if (this.wouldCreateParentCycle(parent)) {
      return Frame.error("$!.cyclic-parent .^");
    }
    this.parent = parent;
    return undefined;
  }

  /** Whether assigning parent would attach this frame to a cyclic chain. */
  public wouldCreateParentCycle(parent: Frame): boolean {
    const seen = new Set<MetaFrame>([this]);
    let current: Frame | undefined = parent;
    while (current && !current.is.missing) {
      if (seen.has(current)) return true;
      seen.add(current);
      current = current.parent;
    }
    return false;
  }

  /**
   * meta_copy creates a shallow copy of the current context.
   */
  public meta_copy(): Context {
    return { ...this.meta };
  }

  /**
   * meta_keys returns an array of keys in the current context.
   */
  public meta_keys(): string[] {
    return Object.keys(this.meta);
  }

  /**
   * meta_length returns the number of keys in the current context.
   */
  public meta_length(): number {
    return this.meta_keys().length;
  }

  /**
   * meta_pairs returns an array of key-value pairs in the current context.
   */
  public meta_pairs(): Array<IKeyValuePair> {
    return Object.entries(this.meta);
  }

  /**
   * meta_string returns a string representation of the current context.
   *
   * Nested values render through the cycle guard, so metadata that reaches this
   * frame again yields an id rather than overflowing the host stack.
   */
  public meta_string(): string {
    return this.meta_pairs().map(([key, value]) => {
      if (key === Frame.kOUT) {
        return `.${key} ${value.id};`;
      }
      return `.${key} ${renderNested(value, () => value.toString())};`;
    }).join(" ");
  }

  /**
   * match_here checks if a target string matches any key in the current context.
   */
  protected match_here(target: string): Frame {
    let result = Frame.missing;
    this.meta_pairs().forEach(([key, value]) => {
      const isPattern = key.match(/\/(.*)\//);
      if (isPattern) {
        const pattern = new RegExp(isPattern[1]);
        if (pattern.test(target)) {
          result = value;
          if ("source" in result) {
            const sourced = result as ISourced;
            sourced.source = target;
          }
        }
      }
    });
    return result;
  }

  private authorize(
    physicalKey: string,
    visibility: Visibility,
    key: string,
    origin: MetaFrame,
  ): BindingResolution | undefined {
    const value = this.meta[physicalKey];
    if (value == null) return undefined;
    const authorized = visibility === Visibility.Public ||
      (visibility === Visibility.Private
        ? origin === this
        : this.isAncestorOf(origin));
    if (authorized) {
      return { owner: this, key: physicalKey, value };
    }
    return {
      owner: this,
      key: physicalKey,
      value: Frame.error(`$!.is-${visibility} .${key}`),
    };
  }

  /**
   * isAncestorOf walks the declared parent chain only. Lexical nesting and
   * syntactic containment confer no protected access: an inner aggregate or an
   * unrelated peer's method is not a descendant.
   */
  private isAncestorOf(origin: MetaFrame): boolean {
    const seen = new Set<MetaFrame>();
    let current: MetaFrame | undefined = origin;
    while (current && !seen.has(current)) {
      if (current === this) return true;
      seen.add(current);
      if (!current.hasDeclaredParent()) return false;
      current = current.parent;
    }
    return false;
  }
}

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
   * kCOUNT is the size operator `.#`, an aggregate's element count (#411).
   */
  public static readonly kCOUNT = "#";
  /**
   * kLEAVES is the size operator `.##`, an aggregate's terminal count (#411,
   * issue occurrence/figure 010.02).
   */
  public static readonly kLEAVES = "##";
  /**
   * kRESIDUAL is `.###`: a FrameInt alternating sum of immediate child native
   * Sizes on non-schema lists, or Count parity (occurrence/figure 011.18c).
   * Other receivers default to nil residual.
   */
  public static readonly kRESIDUAL = "###";
  /** Derived nullable two-channel state (occurrence/figure 011.18c). */
  public static readonly kDEMI = "####";
  /**
   * The size operators, the only names spelled with `#` (#411). Each answers
   * for its receiver through `sizeFor`, never through name lookup.
   */
  public static readonly SIZE_OPERATORS: readonly string[] = [
    Frame.kCOUNT,
    Frame.kLEAVES,
    Frame.kRESIDUAL,
    Frame.kDEMI,
  ];
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

    override sizeFor(key: string): Frame {
      return key === Frame.kCOUNT
        ? this.observationError() ?? Frame.count(0n)
        : super.sizeFor(key);
    }

    override call(argument: Frame): Frame {
      const key = Frame.quantityOperator(argument);
      if (key) return this.sizeFor(key);
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
      const key = Frame.quantityOperator(argument);
      if (key) return this.sizeFor(key);
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
  public referent(_path?: Set<Frame>): Frame {
    return this;
  }

  /** Reference ancestry is separate from aggregate containment ancestry. */
  protected referenceThrough(target: Frame, path: Set<Frame>): Frame {
    if (path.has(this)) {
      const refusal = Frame.error("$!.cyclic-reference");
      // This failed traversal is not a stored opaque error atom of Size 1.
      refusal.is.cyclicReference = true;
      return refusal;
    }
    path.add(this);
    try {
      return target.referent(path);
    } finally {
      path.delete(this);
    }
  }

  /**
   * Whether this is a plain parsed expression: a statement of a body or an
   * aggregate, or a tight expression nested in one (spec a16). A closure is
   * not, though it extends the same class. Asked here so an aggregate's
   * printer can tell, without importing the expression module.
   */
  public isPlainExpression(): boolean {
    return false;
  }

  /**
   * Records the scope an operation was written in, on the fresh value an
   * operator answered for it. Only a fold reads it, to resume a walk there
   * (spec a17); anything else is unchanged.
   */
  public atSite(_site: EvaluationScope): Frame {
    return this;
  }

  /** Concrete syntax/value families, without eager imports of subclasses. */
  public isName(): this is FrameName {
    return false;
  }

  public isSymbol(): this is FrameSymbol {
    return false;
  }

  public isSchema(): this is FrameSchema {
    return false;
  }

  public isClosure(): this is FrameLazy {
    return false;
  }

  /** Whether evaluating this atom resolves a binding in its evaluation scope. */
  public resolvesInScope(): boolean {
    return false;
  }

  /**
   * What a walk over an aggregate yields for this element (#429). A value is
   * itself. A parsed term is syntax, and answers the atom it wraps, so the
   * parser's trivial wrappers never reach a program.
   */
  public walked(): Frame {
    return this;
  }

  /** Installed by FrameCount without importing a subclass into its base. */
  public static count: (value: bigint) => Frame;

  /** Installed by FrameDemi, avoiding a base-to-subclass import cycle. */
  public static demi: (source: Frame) => Frame;

  /** A failure carried by this value, without executing or enumerating it. */
  public observationError(): Frame | undefined {
    return this.is.error || this.is.cyclicReference ? this : undefined;
  }

  /**
   * Native Count, Size, residual and derived Demi. Missing Count falls back to
   * Size; kinds with their own cardinality supply explicit Counts.
   * Nil residual is absence.
   */
  public sizeFor(key: string): Frame {
    if (!Frame.SIZE_OPERATORS.includes(key)) return Frame.nil;
    const failure = this.observationError();
    if (failure) return failure;
    switch (key) {
      case Frame.kCOUNT:
        return this.is.void || this.is.missing
          ? Frame.count(0n)
          : this.sizeFor(Frame.kLEAVES);
      case Frame.kLEAVES: {
        const size = this.nativeSize(new Set());
        return typeof size === "bigint" ? Frame.count(size) : size;
      }
      case Frame.kDEMI:
        return Frame.demi(this);
      default:
        return Frame.nil;
    }
  }

  /** Nonnegative represented quantity; path tracks recursive containment only. */
  public nativeSize(_path: Set<Frame>): bigint | Frame {
    return this.observationError() ?? 1n;
  }

  /**
   * What integer repetition `n x` answers when this frame, x, has a rule of
   * its own, or undefined when x is repeated by application: `FrameInt.repeat`
   * then starts from nil and applies the running answer to x, n times. Only an
   * aggregate has a rule (`FrameList`), so the base answers none. The caller
   * has already refused a negative count.
   */
  public repetitionFor(_count: bigint): Frame | undefined {
    return undefined;
  }

  /**
   * Get a frame by key from this frame's own properties and its declared
   * parents only, never its lexical scope.
   *
   * This is how a call reads its explicit argument (spec 7, layer 2). The
   * argument's lexical scope is wherever that value was built, which the
   * closure did not choose, so following it would let any scope that built an
   * argument bind the closure's names. A handle reads its target, and still
   * binds a method it finds to that target.
   */
  public getOwn(key: string, origin: MetaFrame = this): Frame {
    const seen = new Set<Frame>();
    let frame: Frame | undefined = this.referent();
    while (frame && !seen.has(frame)) {
      seen.add(frame);
      const local = frame.lookup_here(key, origin);
      if (!local.is.missing) return this.lookup_result(local, key);
      frame = frame.hasDeclaredParent() ? frame.parent : undefined;
    }
    return Frame.missing;
  }

  /** Whether a write can land on this frame, so that identity is observable. */
  public ownsIdentity(): boolean {
    return false;
  }

  /**
   * This frame as a value its reader may not write (#419). Only an aggregate
   * owns identity a write can land on, so every other frame is its own
   * read-only view; `FrameArray` answers an immutable handle on itself.
   */
  public readOnly(): Frame {
    return this;
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

  private static quantityOperator(argument: Frame): string | undefined {
    if (argument.className() !== "FrameSymbol" || !argument.is.address) {
      return undefined;
    }
    const key = (argument as unknown as { spelling(): string }).spelling();
    return Frame.SIZE_OPERATORS.includes(key) ? key : undefined;
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
