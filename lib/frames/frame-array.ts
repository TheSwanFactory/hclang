import { type DeclaredApplication, Frame } from "./frame.ts";
import { BoundMethod } from "./bound-method.ts";
import { methodEffect } from "./effect-marker.ts";
import { FrameExpr } from "./frame-expr.ts";
import { FrameCount } from "./frame-count.ts";
import { FrameNumeric, REPETITION_LIMIT } from "./frame-numeric.ts";
import { FrameHandle } from "./frame-handle.ts";
import type { FrameLazy } from "./frame-lazy.ts";
import { FrameList } from "./frame-list.ts";
import { FrameNote } from "./frame-note.ts";
import type { MetaFrame } from "./meta-frame.ts";
import { NilContext } from "./context.ts";
import type { EvaluationInput } from "./evaluation-scope.ts";
import type { SigilStart } from "../scan.ts";

export class FrameArray extends FrameList {
  public static readonly BEGIN_ARRAY = "[";
  public static readonly END_ARRAY = "]";
  public static readonly SIGIL_STARTS = [
    { key: FrameArray.BEGIN_ARRAY, mode: "push" },
    { key: FrameArray.END_ARRAY, mode: "pop" },
  ] as const satisfies readonly SigilStart[];

  constructor(data: Array<Frame>, meta = NilContext) {
    super(data, meta);
  }

  /** Count leaves use the same Star rule at the root and inside an array. */
  public static starCount(count: FrameCount, replacement: Frame): Frame {
    const right = replacement.referent();
    if (right instanceof FrameNumeric) return count.multiply(right);
    const refusal = FrameArray.starCountRefusal(count, replacement);
    if (refusal) return refusal;
    if (count.data === 0n) return count;
    return new FrameArray(Array<Frame>(Number(count.data)).fill(replacement));
  }

  /** Validate expansion before any ancestor is rebuilt or count is expanded. */
  private static starCountRefusal(
    count: FrameCount,
    replacement: Frame,
  ): Frame | undefined {
    if (replacement.referent() instanceof FrameNumeric) return undefined;
    if (count.meta_pairs().length || count.hasDeclaredParent()) {
      return Frame.error("$!.star-metadata *");
    }
    if (count.data > REPETITION_LIMIT) {
      return Frame.error(`$!.repetition-limit ${REPETITION_LIMIT}`);
    }
    return undefined;
  }

  /**
   * Star: replace empty-array terminals and compose count leaves,
   * sharing the replacement.
   * Copy the same native metadata and declaration echoes as ordinary array
   * reconstruction. A decorated terminal cannot be replaced without loss.
   * Validate before rebuilding; neither operand is evaluated or mutated here.
   */
  public star(replacement: Frame): Frame {
    const path = new Set<Frame>();
    const validate = (node: Frame): Frame | undefined => {
      const value = node.referent();
      if (value instanceof FrameCount) {
        return FrameArray.starCountRefusal(value, replacement);
      }
      if (!(value instanceof FrameArray) || path.has(value)) {
        return Frame.error("$!.star-domain *");
      }
      const elements = value.elements();
      if (
        !elements.length &&
        (value.asArray().length || value.meta_pairs().length ||
          value.hasDeclaredParent())
      ) {
        return Frame.error("$!.star-metadata *");
      }
      path.add(value);
      for (const element of elements) {
        const error = validate(element);
        if (error) return error;
      }
      path.delete(value);
      return undefined;
    };
    const error = validate(this);
    if (error) return error;
    const go = (node: FrameArray | FrameCount): Frame => {
      if (node instanceof FrameCount) {
        return FrameArray.starCount(node, replacement);
      }
      if (!node.elements().length) return replacement;
      const result = node.copy();
      result.data = node.itemsFor(
        result,
        (item) =>
          node.repeatsTerm(item)
            ? go(item.walked().referent() as FrameArray | FrameCount)
            : item,
      );
      return result;
    };
    return go(this);
  }

  public override string_open(): string {
    return FrameArray.BEGIN_ARRAY;
  }

  public override string_close(): string {
    return FrameArray.END_ARRAY;
  }

  public override in(input: EvaluationInput = []): Frame {
    const result = new FrameArray([...this.data], this.meta_copy());
    // A declared parent is carried in its own field, so propagation is a copy
    // of that field rather than a flag dance over the lexical pointer.
    if (this.hasDeclaredParent()) {
      result.parent = this.parent;
    }
    // An aggregate accepts declarations while it is under construction, and
    // says so rather than leaving a name to infer it from the context stack.
    // The mark is scoped to that construction: once built, the aggregate is a
    // value, so appearing in a later context stack (as a method receiver, say)
    // does not make it absorb declarations.
    result.declares = true;
    try {
      result.data = this.array_eval(input, result);
    } finally {
      result.declares = false;
    }
    return FrameArray.illFormed(result.data) ?? result;
  }

  /**
   * The refusal that stopped this literal from being a well-formed value.
   *
   * Narrow on purpose. An aggregate whose element is an error is an ordinary
   * value — that is exactly what a collected refusal looks like, and what keeps
   * `'./nope.txt' | []` an array rather than a bare error — and a refused write
   * leaves a value a caller can still inspect, with that one write undone. Only
   * a declaration whose key collides with the addresses this aggregate itself
   * assigns makes the value unbuildable, so only that one is promoted.
   */
  private static illFormed(terms: readonly Frame[]): Frame | undefined {
    for (const term of terms) {
      const value = FrameExpr.answeredValue(term);
      if (value.is.addressTaken === true) return value;
    }
    return undefined;
  }

  /** Aggregates own identity, so `===` compares them by reference. */
  public override ownsIdentity(): boolean {
    return true;
  }

  /**
   * An array exposes its ordered stored contents for residual; properties
   * and declared parents are excluded. Source forms are not executed.
   */
  protected override supportsResidual(): boolean {
    return true;
  }

  /**
   * An immutable handle on this aggregate, as a name reads it: applying it
   * collects onto a copy and its mutating methods answer functional updates.
   */
  public override readOnly(): Frame {
    return new FrameHandle(this, false);
  }

  /**
   * `=` compares the complete view, the same one `&&` iterates: visible
   * properties in declaration order, then elements by index, each by `=`.
   * Spelling, private fields, the declared parent, and ids are not the value.
   */
  public override equals(other: Frame): Frame {
    return this.sameMembers(other, (left, right) => left.equals(right));
  }

  /** `==` is the same walk with `==` at every node. */
  public override typeEquals(other: Frame): Frame {
    return this.sameMembers(other, (left, right) => left.typeEquals(right));
  }

  /** Pairs under comparison, so a frame reachable from itself terminates. */
  private static readonly comparing = new Map<Frame, Set<Frame>>();

  private sameMembers(
    other: Frame,
    same: (left: Frame, right: Frame) => Frame,
  ): Frame {
    const right = other.referent();
    if (right === this) return Frame.all;
    if (right.constructor !== this.constructor) return Frame.nil;

    const inProgress = FrameArray.comparing.get(this) ?? new Set<Frame>();
    if (inProgress.has(right)) return Frame.all;
    inProgress.add(right);
    FrameArray.comparing.set(this, inProgress);
    try {
      const keys = this.visibleKeys();
      const rightKeys = right.visibleKeys();
      if (
        keys.length !== rightKeys.length ||
        keys.some((key, index) => key !== rightKeys[index])
      ) return Frame.nil;
      for (const key of keys) {
        if (same(this.get_here(key), right.get_here(key)) !== Frame.all) {
          return Frame.nil;
        }
      }
      const elements = this.elements();
      const rightElements = right.elements();
      if (elements.length !== rightElements.length) return Frame.nil;
      return elements.every((element, index) =>
          same(element, rightElements[index]) === Frame.all
        )
        ? Frame.all
        : Frame.nil;
    } finally {
      inProgress.delete(right);
      if (inProgress.size === 0) FrameArray.comparing.delete(this);
    }
  }

  /**
   * An instance copy is a fresh aggregate whose members are shared, so a
   * member keeps its identity until a write is about to land on it. Copy on
   * write copies that member then, into the copy that holds it
   * (`FrameHandle.copyOnWriteTarget`, #401), so writing through the copy is
   * still invisible through the original at any depth. A declared parent rides
   * along in its own field, and the id is always fresh.
   */
  public override instanceCopy(): Frame {
    return this.copy();
  }

  /** Elements are members too, so a held element can be replaced in place. */
  public override replaceMember(member: Frame, replacement: Frame): boolean {
    let replaced = super.replaceMember(member, replacement);
    this.data = this.data.map((item) => {
      if (item !== member) return item;
      replaced = true;
      return replacement;
    });
    return replaced;
  }

  protected override lookup_here(key: string, origin: MetaFrame): Frame {
    if (Frame.isIndexKey(key)) {
      return this.at(Number(key));
    }
    return super.lookup_here(key, origin);
  }

  /**
   * An aggregate collects, which is what makes applying to one a push, unless
   * it declares its own application. A declared application is an operation,
   * so a refusal applied to one stays a refusal rather than being held.
   */
  public override collects(): boolean {
    return this.applicationMethod() === undefined;
  }

  /** The keys an aggregate declares its own application under, mutating first. */
  public static readonly APPLICATION_KEYS = ["apply_", "apply"] as const;

  /**
   * The method this aggregate declares as its own application (#375).
   *
   * Applying an aggregate collects, and a receiver that wants another rule
   * declares it as a method named `apply`, or `apply_` when the rule writes the
   * receiver. It is found on the aggregate or its declared parents, the same
   * chain a class's methods come from, and never in the scope around it, so a
   * plain array keeps collecting wherever it is written.
   */
  public override applicationMethod(): DeclaredApplication | undefined {
    for (const key of FrameArray.APPLICATION_KEYS) {
      const method = this.declaredMethod(key);
      if (method) return { key, method };
    }
    return undefined;
  }

  /** The key an aggregate declares its readable text under (#398). */
  public static readonly TEXT_KEY = "toText";

  /**
   * What this aggregate contributes when text receives it (#398).
   *
   * Text contributes an aggregate's spelling, which reads back as the same
   * value but spells every declaration, methods included. An aggregate that
   * declares `toText`, on itself or a declared parent, contributes that
   * method's answer instead, the way one that declares `apply` decides its own
   * application. The printer never calls it, so a printed value still reads
   * back.
   */
  public override toText(): Frame {
    const method = this.declaredMethod(FrameArray.TEXT_KEY);
    if (!method) return this;
    return new BoundMethod(
      method as FrameLazy,
      this,
      false,
      methodEffect(FrameArray.TEXT_KEY),
    ).call(Frame.nil);
  }

  /**
   * The size operators an aggregate may declare its own answer to (011.20):
   * Count, Size and residual. `.####` is not among them, because it is always
   * derived from these three, so a class that declares them gets it for free.
   */
  public static readonly OBSERVATION_KEYS: readonly string[] = [
    Frame.kCOUNT,
    Frame.kLEAVES,
    Frame.kRESIDUAL,
  ];

  /** Declared observations in progress, so one that reads itself fails. */
  private static readonly observing = new Map<FrameArray, Set<string>>();

  /**
   * How deeply declared observations may nest. A cycle through the same
   * receivers is caught exactly; one that builds a fresh receiver each step
   * is not, so nesting is bounded too, far above any real class's need.
   */
  public static readonly OBSERVATION_DEPTH_LIMIT = 32;

  /** Declared observations now running, across every receiver. */
  private static observationDepth = 0;

  /**
   * An aggregate observes its elements, so a class that keeps its state in
   * fields observes as its empty element list: Count 0, Size 1, residual 0.
   * One that declares a method named `#`, `##` or `###`, on itself or a
   * declared parent, answers that method's result instead, the way one that
   * declares `apply` decides its own application (011.20). Nothing declares
   * one by default, so every other aggregate observes exactly as before.
   *
   * The answer must be the kind the operator answers: a Count for `#` and
   * `##`, an exact integer for `###`. Anything else is
   * `$!.declared-observation`, an error the method answered is answered as it
   * is, and a method that observes its own receiver the same way, directly
   * or through other declared observations, is `$!.cyclic-observation`.
   * Nesting deeper than `OBSERVATION_DEPTH_LIMIT`, as a method that observes
   * a fresh instance of its own class does, is `$!.observation-depth`.
   *
   * The method runs immutably, so it cannot write its receiver. It is still
   * code the class wrote: it runs on every observation, with no caching, and
   * may act on anything else it can reach, a mutable handle in scope
   * included. Observation is pure only for classes that keep it pure.
   *
   * @param key A size operator.
   * @returns The declared answer, or undefined when none is declared.
   */
  private declaredObservation(key: string): Frame | undefined {
    if (!FrameArray.OBSERVATION_KEYS.includes(key)) return undefined;
    const method = this.declaredMethod(key);
    if (!method) return undefined;
    const active = FrameArray.observing.get(this) ?? new Set<string>();
    if (active.has(key)) return Frame.error(`$!.cyclic-observation .${key}`);
    if (FrameArray.observationDepth >= FrameArray.OBSERVATION_DEPTH_LIMIT) {
      return Frame.error(`$!.observation-depth .${key}`);
    }
    active.add(key);
    FrameArray.observing.set(this, active);
    FrameArray.observationDepth++;
    let answer: Frame;
    try {
      answer = new BoundMethod(
        method as FrameLazy,
        this,
        false,
        methodEffect(key),
      ).call(Frame.nil).referent();
    } finally {
      FrameArray.observationDepth--;
      active.delete(key);
      if (active.size === 0) FrameArray.observing.delete(this);
    }
    const failure = answer.observationError();
    if (failure) return failure;
    const data = (answer as unknown as { data?: unknown }).data;
    const valid = key === Frame.kRESIDUAL
      ? answer.className() === "FrameInt" || answer instanceof FrameCount
      : answer instanceof FrameCount;
    return valid && typeof data === "bigint"
      ? answer
      : Frame.error(`$!.declared-observation .${key}`);
  }

  /** A declared Count, Size or residual first; the list's own rule otherwise. */
  public override sizeFor(key: string): Frame {
    const failure = this.observationError();
    if (failure && Frame.SIZE_OPERATORS.includes(key)) return failure;
    return this.declaredObservation(key) ?? super.sizeFor(key);
  }

  /**
   * A declared Size is also what this aggregate contributes inside another,
   * so `[d, d].##` adds the declared Sizes rather than one terminal for each.
   */
  public override nativeSize(path: Set<Frame>): bigint | Frame {
    const failure = this.observationError();
    if (failure) return failure;
    const declared = this.declaredObservation(Frame.kLEAVES);
    if (declared === undefined) return super.nativeSize(path);
    return declared instanceof FrameCount ? declared.data : declared;
  }

  /**
   * A method declared under `key` on this aggregate or its declared parents.
   *
   * Never the scope around it, so a plain array keeps its default behavior
   * wherever it is written.
   */
  private declaredMethod(key: string): Frame | undefined {
    const seen = new Set<Frame>([this]);
    let local = this.get_here(key);
    let next = this.hasDeclaredParent() ? this.parent : undefined;
    while (local.is.missing && next && !seen.has(next)) {
      seen.add(next);
      local = next.get_here(key);
      next = next.hasDeclaredParent() ? next.parent : undefined;
    }
    return local.className() === "FrameLazy" ? local : undefined;
  }

  /**
   * Runs a declared application with the receiver it binds to.
   *
   * The effect axis decides writes, as it does for every method: `apply_`
   * reached mutably writes the receiver and answers it, and reached immutably
   * answers an updated copy. A step that answers nil leaves the receiver as it
   * was, the way an aggregate ignores a nil argument, so a reduce can skip an
   * element without losing what it accumulated.
   */
  public static applyDeclared(
    bound: BoundMethod,
    argument: Frame,
    unchanged: Frame,
  ): Frame {
    const result = bound.call(argument);
    return result.is.void ? unchanged : result;
  }

  /**
   * A fresh aggregate holding the same elements. Only the outer aggregate is
   * new: the elements are shared, so collecting reuses them rather than
   * copying, and `===` still finds each one.
   */
  public override collectingCopy(): FrameArray {
    return this.copy();
  }

  public override apply(argument: Frame, _parameter: Frame): Frame {
    const declared = this.applicationMethod();
    if (declared) {
      const bound = new BoundMethod(
        declared.method as FrameLazy,
        this,
        true,
        methodEffect(declared.key),
      );
      return FrameArray.applyDeclared(bound, argument, this);
    }
    return this.collect(argument);
  }

  /** Pushes a non-nil value, whatever application this aggregate declares. */
  public override collect(
    value: Frame,
    _context: Frame = Frame.nil,
  ): FrameArray {
    if (!value.is.void) {
      this.data.push(value);
    }
    return this;
  }

  /**
   * The element at `index`, counting from the end when negative.
   *
   * An index addresses the element plane, the one `&` iterates, so declaring a
   * property never shifts an element's index: `[.k 1; 4, 5] .0` is `4`.
   */
  public override at(index: number): Frame {
    const elements = this.elements();
    const n = elements.length;
    if (index >= n || -index > n) {
      const source = "[0.." + n + "]." + index;
      return FrameNote.index(source);
    }
    return elements[index >= 0 ? index : n + index];
  }

  public length(): number {
    return this.data.length;
  }

  public reset(): void {
    this.data = [];
  }
}
