import { Frame } from "./frame.ts";
import { type Context, NilContext } from "./context.ts";
import { type EvaluationInput, EvaluationScope } from "./evaluation-scope.ts";
import { FrameCount } from "./frame-count.ts";
import { REPETITION_ELEMENT_LIMIT } from "./frame-numeric.ts";
import { renderNested } from "./stringify.ts";
import type { FrameBinding } from "./frame-symbol.ts";

/**
 * A term of a source statement, as it was written: a tight expression, terms
 * that abut as `o.x` does, in parentheses, since the spacing that bound them
 * cannot be restored and `(o .x)` means the same; anything else as itself.
 */
export const renderSourceTerm = (term: Frame): string =>
  renderNested(
    term,
    () =>
      term.isPlainExpression()
        ? `(${term.asArray().map(renderSourceTerm).join(" ")})`
        : term.toString(),
  );

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
      // A source aggregate prints as it was written: each statement bare,
      // with a tight expression nested in it parenthesised (spec a16). A
      // value's terms print as themselves.
      const text = this.is.source === true && obj.isPlainExpression()
        ? obj.asArray().map(renderSourceTerm).join(" ")
        : renderNested(obj, () => obj.toString());
      return text + sep;
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
    if (this.is.source === true && FrameList.walkSource) {
      return FrameList.walkSource(this.data);
    }
    return this.data.filter((item) => this.isElement(item)).map((item) =>
      item.walked()
    );
  }

  /**
   * How a source aggregate walks: as a closure body does, its statements'
   * atoms with `;` and `,` kept (spec a16). Installed by `frame-expr.ts`,
   * which this module cannot import without closing a cycle.
   */
  public static walkSource?: (terms: readonly Frame[]) => Frame[];

  /**
   * The elements a size operator counts: `elements()`, unless a kind can
   * count them more cheaply, as a closure does without its scope (a17).
   */
  protected countedElements(): Array<Frame> {
    return this.elements();
  }

  /** Whether this term is one of the elements, as `elements()` reads them. */
  private isElement(term: Frame): boolean {
    return term.is.statement !== true && !this.holdsAsProperty(term);
  }

  /**
   * `.#` counts this aggregate's elements (#411) and `.##` the terminals of
   * its structure (issue occurrence/figure 010.02), so neither counts a
   * property. Every aggregate is a list, so each one answers here rather than
   * in its own class.
   */
  public override sizeFor(key: string): Frame {
    if (key === Frame.kCOUNT) {
      return new FrameCount(BigInt(this.countedElements().length));
    }
    const terminals = this.terminalCount(new Set());
    return terminals === undefined
      ? Frame.error(`$!.cyclic-aggregate .${key}`)
      : new FrameCount(terminals);
  }

  /**
   * The terminals of this aggregate's structure, the nodes with no elements
   * below them. An aggregate with no elements is itself one terminal, at the
   * root or nested, so `[]` counts 1 and `.##` never answers 0 for an
   * aggregate. A nonempty aggregate counts its elements' terminals: each
   * element that is not an aggregate is one terminal, and each aggregate
   * element counts its own, at any depth. Properties are not elements, so an
   * aggregate holding only properties is one terminal too.
   *
   * On finite, property-free nested arrays this is Figure terminal count:
   * `[[], [[], []]].##` is 3. Through v0.32.1 an empty aggregate counted 0,
   * so `.##` counted only the non-aggregate leaves (#411).
   *
   * `path` holds only the aggregates from the root down to this one, so a
   * branch reached twice counts twice, and one that contains itself answers
   * undefined.
   */
  private terminalCount(path: Set<Frame>): bigint | undefined {
    if (path.has(this)) return undefined;
    const elements = this.countedElements();
    if (elements.length === 0) return 1n;
    path.add(this);
    let terminals = 0n;
    for (const element of elements) {
      const value = element.referent();
      const below = value instanceof FrameList ? value.terminalCount(path) : 1n;
      if (below === undefined) return undefined;
      terminals += below;
    }
    path.delete(this);
    return terminals;
  }

  /**
   * `n x` for an aggregate concatenates (v0.22.0). The answer is a fresh
   * aggregate of x's kind holding the terms x keeps once, its properties and
   * statements, followed by the terms it repeats, its elements, n times in
   * order. The repeated terms are shared, as a collect shares what it
   * collects, so each keeps its identity. x itself is never answered or
   * written, so repeating a value builds no cycle. Properties stay once, as a
   * reduce keeps only its receiver's: `[3, 4] | xs` concatenates into a copy
   * of `xs`.
   *
   * An aggregate that declares its own application (#375) answers none, so
   * repetition runs that application, as before. No application is performed
   * here, so the answer is bounded by its size, at `REPETITION_ELEMENT_LIMIT`
   * repeated terms, and refused with the error repeated text uses.
   */
  public override repetitionFor(count: bigint): Frame | undefined {
    if (this.applicationMethod() !== undefined) return undefined;
    const repeated = this.data.filter((term) => this.repeatsTerm(term));
    if (BigInt(repeated.length) * count > REPETITION_ELEMENT_LIMIT) {
      return Frame.error(`$!.repetition-size ${REPETITION_ELEMENT_LIMIT}`);
    }
    const result = this.copy();
    const terms = result.data.filter((term) => !result.repeatsTerm(term));
    // Within the limit, the loop runs at most that many times, and an
    // aggregate with nothing to repeat skips it however large the count is.
    const times = repeated.length === 0 ? 0 : Number(count);
    for (let time = 0; time < times; time += 1) {
      for (const term of repeated) terms.push(term);
    }
    result.data = terms;
    return result.finishRepetition();
  }

  /**
   * Whether repetition repeats this term, rather than keeping it once. An
   * aggregate repeats its elements and keeps its properties and statements
   * once, as a reduce into it would.
   */
  protected repeatsTerm(term: Frame): boolean {
    return this.isElement(term);
  }

  /**
   * What a repetition answers once its terms are in place: this aggregate,
   * unless its kind has no value of that shape.
   */
  protected finishRepetition(): Frame {
    return this;
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
    return binding !== undefined && binding.target === this;
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
