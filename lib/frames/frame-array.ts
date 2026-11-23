import { type DeclaredApplication, Frame } from "./frame.ts";
import { BoundMethod } from "./bound-method.ts";
import { methodEffect } from "./effect-marker.ts";
import { afterCommit, beforeCommit } from "./effect-registry.ts";
import { FrameExpr } from "./frame-expr.ts";
import { FrameCount } from "./frame-count.ts";
import { FrameHandle } from "./frame-handle.ts";
import type { FrameLazy } from "./frame-lazy.ts";
import { FrameList } from "./frame-list.ts";
import { FrameNote } from "./frame-note.ts";
import type { MetaFrame } from "./meta-frame.ts";
import { NilContext } from "./context.ts";
import {
  guardAccess,
  noteElements,
  noteHolding,
  noteRead,
  PARENT_KEY,
} from "./reference-tracking.ts";
import type { EvaluationInput } from "./evaluation-scope.ts";
import type { SigilStart } from "../scan.ts";
import {
  applicationDeclaredBy,
  applyDeclared,
  observationDeclaredBy,
  operatorDeclaredBy,
  textDeclaredBy,
} from "./declared-protocol.ts";

/**
 * An aggregate, written `[...]`: properties and elements in one value.
 *
 * Applying a value to an aggregate collects it, unless the aggregate declares
 * its own application. `evaluate` answers one, holding a source unit's results
 * and top-level declarations.
 */
export class FrameArray extends FrameList {
  /** The character that opens an aggregate. */
  public static readonly BEGIN_ARRAY = "[";
  /** The character that closes an aggregate. */
  public static readonly END_ARRAY = "]";
  /** How the lexer recognizes an aggregate: `[` opens one and `]` closes it. */
  public static readonly SIGIL_STARTS = [
    { key: FrameArray.BEGIN_ARRAY, mode: "push" },
    { key: FrameArray.END_ARRAY, mode: "pop" },
  ] as const satisfies readonly SigilStart[];

  /** An aggregate holding `data` as its terms and `meta` as its properties. */
  constructor(data: Array<Frame>, meta = NilContext) {
    super(data, meta);
    // An aggregate holds its elements from birth (reference-tracking.ts).
    noteElements(this, data);
  }

  /**
   * Assigning the element plane whole releases the elements held before and
   * holds the new ones, element i under the key `i`.
   */
  protected override adoptData(data: Array<Frame>): void {
    const previous = this.data;
    super.adoptData(data);
    if (previous !== data) noteElements(this, data, previous);
  }

  /** An aggregate begins with `[`. */
  public override string_open(): string {
    return FrameArray.BEGIN_ARRAY;
  }

  /** An aggregate ends with `]`. */
  public override string_close(): string {
    return FrameArray.END_ARRAY;
  }

  /**
   * Evaluates this literal's terms in `input` into a fresh aggregate, which
   * keeps the declared parent and accepts declarations while it is built. A
   * refusal that leaves it ill-formed is the answer instead (`illFormed`).
   */
  public override in(input: EvaluationInput = []): Frame {
    const result = new FrameArray([...this.data], this.meta_copy());
    // A declared parent is carried in its own field, so propagation is a copy
    // of that field rather than a flag dance over the lexical pointer.
    if (this.hasDeclaredParent()) {
      result.parent = this.parent;
      noteHolding(result, PARENT_KEY, this.parent);
    }
    // An aggregate accepts declarations while it is under construction, and
    // says so rather than leaving a name to infer it from the context stack.
    // The mark is scoped to that construction: once built, the aggregate is a
    // value, so appearing in a later context stack (as a method receiver, say)
    // does not make it absorb declarations.
    result.declares = true;
    try {
      result.adoptData(this.array_eval(input, result));
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

  /**
   * Compares this aggregate with `other` by `same` at every member: the
   * visible properties in order, then the elements by index. Aggregates of
   * different classes differ, and a pair already under comparison counts as
   * equal, so a cycle terminates.
   */
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

  /** Reading the element plane is a read of this aggregate's state. */
  public override elements(): Frame[] {
    guardAccess(this, "read");
    noteRead(this);
    return super.elements();
  }

  /** Elements are members too, so a held element can be replaced in place. */
  public override replaceMember(member: Frame, replacement: Frame): boolean {
    const replaced = super.replaceMember(member, replacement);
    let elementReplaced = false;
    this.data.forEach((item, index) => {
      if (item !== member) return;
      if (!replaced && !elementReplaced) beforeCommit(this);
      this.data[index] = replacement;
      noteHolding(this, String(index), replacement, member);
      elementReplaced = true;
    });
    if (elementReplaced && !replaced) afterCommit(this);
    return replaced || elementReplaced;
  }

  /** An index key reads the element there; any other key, a binding. */
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

  /**
   * The method this aggregate declares as its own application, `apply_` or
   * `apply`, on itself or a declared parent (#375, `applicationDeclaredBy`).
   *
   * @ignore
   */
  public override applicationMethod(): DeclaredApplication | undefined {
    return applicationDeclaredBy(this);
  }

  /**
   * The method this aggregate declares for the operator `key`, bound to it as
   * the left operand, or undefined when it declares none (015.02,
   * `operatorDeclaredBy`).
   *
   * @ignore
   */
  public declaredOperator(key: string): BoundMethod | undefined {
    return operatorDeclaredBy(this, key);
  }

  /**
   * What this aggregate contributes when text receives it (#398): the answer
   * of the `toText` method it declares (`textDeclaredBy`), or else itself, so
   * text takes its spelling.
   */
  public override toText(): Frame {
    return textDeclaredBy(this) ?? this;
  }

  /** A declared Count or Size first; the list's own rule otherwise. */
  public override sizeFor(key: string): Frame {
    const failure = this.observationError();
    if (failure && Frame.SIZE_OPERATORS.includes(key)) return failure;
    return observationDeclaredBy(this, key) ?? super.sizeFor(key);
  }

  /**
   * A declared Size is also what this aggregate contributes inside another,
   * so `[d, d].##` adds the declared Sizes rather than one terminal for each.
   */
  public override nativeSize(path: Set<Frame>): bigint | Frame {
    const failure = this.observationError();
    if (failure) return failure;
    const declared = observationDeclaredBy(this, Frame.kLEAVES);
    if (declared === undefined) return super.nativeSize(path);
    return declared instanceof FrameCount ? declared.data : declared;
  }

  /**
   * A fresh aggregate holding the same elements. Only the outer aggregate is
   * new: the elements are shared, so collecting reuses them rather than
   * copying, and `===` still finds each one.
   */
  public override collectingCopy(): FrameArray {
    return this.copy();
  }

  /**
   * `-` applied to a Denum answers its sign half-turn (`Frame.negateDenum`);
   * anything else dispatches as `Frame.called_by` does.
   */
  public override called_by(context: Frame, parameter: Frame): Frame {
    if ("operator" in context && context.operator === "-") {
      const negated = Frame.negateDenum(this);
      if (negated) return negated;
    }
    return super.called_by(context, parameter);
  }

  /**
   * Runs the application this aggregate declares, if any, on `argument`
   * (`applyDeclared`), and otherwise collects `argument`.
   */
  public override apply(argument: Frame, _parameter: Frame): Frame {
    const declared = this.applicationMethod();
    if (declared) {
      const bound = new BoundMethod(
        declared.method as FrameLazy,
        this,
        true,
        methodEffect(declared.key),
      );
      return applyDeclared(bound, argument, this);
    }
    return this.collect(argument);
  }

  /** Pushes a non-nil value, whatever application this aggregate declares. */
  public override collect(
    value: Frame,
    _context: Frame = Frame.nil,
  ): FrameArray {
    if (!value.is.void) {
      beforeCommit(this);
      this.data.push(value);
      noteHolding(this, String(this.data.length - 1), value);
      afterCommit(this);
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

  /**
   * The number of terms in the data plane, statements and declaration echoes
   * included. `elements()` answers the elements alone.
   */
  public length(): number {
    return this.data.length;
  }

  /** Empties the data plane, as one write to this aggregate. */
  public reset(): void {
    beforeCommit(this);
    this.adoptData([]);
    afterCommit(this);
  }
}
