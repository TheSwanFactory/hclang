import { type DeclaredApplication, Frame } from "./frame.ts";
import { BoundMethod } from "./bound-method.ts";
import { methodEffect } from "./effect-marker.ts";
import { FrameExpr } from "./frame-expr.ts";
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
   * Aggregates are where identity matters, so an instance copy isolates them:
   * every nested aggregate, in the data plane and the metadata plane alike, gets
   * fresh identity, and writing through the copy is invisible through the
   * original at any depth. Atoms and closure bodies are shared, since neither
   * carries identity a write can land on. A declared parent rides along in its
   * own field, and the id is always fresh.
   */
  public override instanceCopy(seen: Map<Frame, Frame> = new Map()): Frame {
    const copied = seen.get(this);
    if (copied) {
      return copied;
    }
    const clone = this.copy();
    seen.set(this, clone);
    clone.data = this.itemsFor(clone, (item) => item.instanceCopy(seen));
    for (const [key, value] of this.meta_pairs()) {
      clone.set(key, value.instanceCopy(seen));
    }
    return clone;
  }

  protected override lookup_here(key: string, origin: MetaFrame): Frame {
    if (/^\d+$/.test(key)) {
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
      const seen = new Set<Frame>([this]);
      let local = this.get_here(key);
      let next = this.hasDeclaredParent() ? this.parent : undefined;
      while (local.is.missing && next && !seen.has(next)) {
        seen.add(next);
        local = next.get_here(key);
        next = next.hasDeclaredParent() ? next.parent : undefined;
      }
      if (local.className() === "FrameLazy") return { key, method: local };
    }
    return undefined;
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
