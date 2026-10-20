import { Frame } from "./frame.ts";
import { type Context, NilContext } from "./context.ts";
import { type EvaluationInput, EvaluationScope } from "./evaluation-scope.ts";
import { FrameCount } from "./frame-count.ts";
import { renderNested } from "./stringify.ts";
import type { FrameBinding } from "./frame-symbol.ts";

/**
 * The declaration a term recorded, when it is a declaration echo.
 *
 * Read structurally rather than by class, because the type is only needed to
 * name the binding: importing the symbol module for an `instanceof` would close
 * a cycle through this file's own base class.
 */
const echoedBinding = (term: Frame): FrameBinding | undefined =>
  (term as unknown as { readonly binding?: FrameBinding }).binding;

/**
 * The `IArrayConstructor` interface defines a constructor for creating
 * `Frame` objects from an array of `Frame` objects and a `Context`.
 */
export interface IArrayConstructor {
  new (data: Array<Frame>, meta: Context): Frame;
}

const stripLastComma = (result: Array<string>): Array<string> => {
  if (!result || result.length < 1) {
    return result;
  }
  const n = result.length - 1;
  const last = result[n];
  const n_last = last.length - 1;
  if (last[n_last] === ",") {
    result[n] = last.substring(0, n_last);
  }
  return result;
};

export class FrameList extends Frame {
  constructor(protected data: Array<Frame>, meta: Context = NilContext) {
    super(meta);
  }

  public override string_open(): string {
    return Frame.BEGIN_EXPR;
  }

  public override string_close(): string {
    return Frame.END_EXPR;
  }

  /**
   * The terms that print, which is every term this frame does not already hold.
   *
   * A declaration writes a property, and the property is what prints, so the
   * echo an evaluated aggregate retains in its data plane is not rendered a
   * second time. Printing both put one value in two places and made canonical
   * output unreadable as input: `[.a 1; 1, 2, .a 1;]` re-read declares `.a`
   * twice.
   */
  protected renderedTerms(): Array<Frame> {
    return this.data.filter((item) => !this.holdsAsProperty(item));
  }

  public toStringDataArray(): Array<string> {
    const result = this.renderedTerms().map((obj: Frame) => {
      const sep = (obj.is.statement) ? ";" : ",";
      return renderNested(obj, () => obj.toString()) + sep;
    });
    return result;
  }

  /**
   * Properties first, then elements, which is the order iteration uses too.
   *
   * Print order and the order the doubled operators walk a value are one order,
   * so a reader who has seen either has seen both.
   */
  public toStringArray(): string[] {
    const elements = stripLastComma(this.toStringDataArray());
    if (this.meta_length() > 0) {
      return [this.meta_string(), ...elements];
    }
    return elements;
  }

  public isEmpty(): boolean {
    return (this.data.length === 0);
  }

  public override toString(): string {
    return this.string_open() + this.toStringArray().join(" ") +
      this.string_close();
  }

  public override dataString(): string {
    // Evaluated property declarations are retained as data-plane assignment
    // echoes as well as metadata. Exclude those echoes from data-only equality.
    const declarationEchoes = new Set(
      this.meta_pairs().map(([key, value]) => `.${key} ${value}`),
    );
    const data = this.data.filter(
      (item) => !declarationEchoes.has(item.toString()),
    );
    // Only the surviving items are rendered for output, so only they need the
    // cycle guard. The membership test above needs no guard of its own: each
    // descent within `item.toString()` is already guarded, so it terminates
    // whether or not this frame is itself mid-render.
    return this.string_open() +
      data.map((item) => renderNested(item, () => item.dataString())).join(
        ",",
      ) +
      this.string_close();
  }

  public override asArray(): Array<Frame> {
    return this.data;
  }

  /**
   * The elements, which are the terms that answered a value of their own.
   *
   * A statement answers nothing, and a declaration this frame holds answers a
   * property, so neither is an element. That is what makes properties and
   * elements two planes rather than one list with configuration mixed into it,
   * and it is why a value whose contents are all properties has nothing to
   * iterate.
   */
  public override elements(): Array<Frame> {
    return this.data.filter((item) =>
      item.is.statement !== true && !this.holdsAsProperty(item)
    );
  }

  /**
   * `.#` counts this aggregate's elements and `.##` the leaves below them
   * (#411), so neither counts a property. Every aggregate is a list, so each
   * one answers here rather than in its own class.
   */
  public override sizeFor(key: string): Frame {
    if (key === Frame.kCOUNT) {
      return new FrameCount(BigInt(this.elements().length));
    }
    const leaves = this.leafCount(new Set());
    return leaves === undefined
      ? Frame.error(`$!.cyclic-aggregate .${key}`)
      : new FrameCount(leaves);
  }

  /**
   * The leaves below this aggregate: each element that is not itself an
   * aggregate counts once, at any depth, so an empty aggregate adds none.
   * `path` holds only the aggregates from the root down to this one, so a
   * branch reached twice counts twice, and one that contains itself answers
   * undefined.
   */
  private leafCount(path: Set<Frame>): bigint | undefined {
    if (path.has(this)) return undefined;
    path.add(this);
    let leaves = 0n;
    for (const element of this.elements()) {
      const value = element.referent();
      const below = value instanceof FrameList ? value.leafCount(path) : 1n;
      if (below === undefined) return undefined;
      leaves += below;
    }
    path.delete(this);
    return leaves;
  }

  /**
   * The value a term answered, looking through a statement's wrapper.
   *
   * A terminated declaration is still a declaration, so the echo has to be
   * reachable through the wrapper that records the terminator.
   */
  protected answeredValue(term: Frame): Frame {
    return term.is.statement === true && term instanceof FrameList &&
        term.size() === 1
      ? term.asArray()[0]
      : term;
  }

  /**
   * Whether this term is the echo of a declaration this frame itself holds.
   *
   * Ownership is the question, not whether a declaration happened. A term that
   * declared into an enclosing scope leaves its echo here and its property
   * there, so this frame's echo is the only record of it and dropping it would
   * lose the value outright.
   */
  protected holdsAsProperty(term: Frame): boolean {
    const binding = echoedBinding(this.answeredValue(term));
    return binding !== undefined && binding.target.deref() === this;
  }

  public size(): number {
    return this.data.length;
  }

  public override copy(): this {
    const clone = super.copy();
    clone.data = this.itemsFor(clone, (item) => item);
    return clone;
  }

  /**
   * This frame's items as a copy holds them.
   *
   * An echo records which frame holds its property, so an echo this frame
   * holds is re-issued for the copy. Otherwise the copy would print and
   * iterate its own declarations as though another frame held them.
   */
  protected itemsFor(clone: FrameList, other: (item: Frame) => Frame): Frame[] {
    return this.data.map((item) =>
      this.holdsAsProperty(item)
        ? FrameList.reownedEcho(item, clone)
        : other(item)
    );
  }

  /**
   * A declaration echo re-issued for `owner`, looking through a statement's
   * wrapper. The echo is read structurally for the same reason as
   * `echoedBinding`.
   */
  private static reownedEcho(term: Frame, owner: Frame): Frame {
    if (term.is.statement === true && term instanceof FrameList) {
      const wrapper = term.copy();
      wrapper.data = term.data.map((inner) =>
        FrameList.reownedEcho(inner, owner)
      );
      return wrapper;
    }
    const echo = term as unknown as { reownedBy?(owner: Frame): Frame };
    return echo.reownedBy ? echo.reownedBy(owner) : term;
  }

  /** Evaluate source items with an explicit innermost declaration target. */
  protected array_eval(
    input: EvaluationInput,
    out: Frame = this,
  ): Array<Frame> {
    const scope = EvaluationScope.from(input).withWriteTarget(
      out,
      "construction",
    );
    return this.data.map((frame) => frame.in(scope));
  }
}
