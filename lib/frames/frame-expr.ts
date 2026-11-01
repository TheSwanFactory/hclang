import { Frame } from "./frame.ts";
import { FrameList } from "./frame-list.ts";
import type { FrameName } from "./frame-name.ts";
import { FrameWord } from "./frame-word.ts";
import { type EvaluationInput, EvaluationScope } from "./evaluation-scope.ts";
import { renderNested } from "./stringify.ts";

/**
 * A parsed expression: an ordered list of terms evaluated against a scope.
 *
 * Constructing one establishes no ancestry over its terms. Syntax containment
 * is not lexical ancestry, and closure calls may evaluate these shared items
 * repeatedly, so re-parenting them here would make one call's scope visible to
 * the next (#329).
 */
export class FrameExpr extends FrameList {
  public override in(input: EvaluationInput = []): Frame {
    return this.asStatement(this.evaluate(input));
  }

  /** Evaluates this expression without exposing its statement wrapper. */
  public evaluate(input: EvaluationInput = []): Frame {
    const scope = EvaluationScope.from(input).withLayer(this);
    const retrieval = this.schemaRetrieval(scope);
    if (retrieval) return retrieval;

    const definition = this.schemaDefinition(scope);
    if (definition) return definition;

    return FrameExpr.evaluateTerms(this.data, scope);
  }

  /**
   * Evaluates a closure body: `;` sequences, and `,` collects, as everywhere.
   *
   * `sequence` records that the author wrote `;` between terms, so intent comes
   * from the parser rather than from inspecting flags on the body's children.
   * Terms the source separated with `,`, or with a newline, which is the same
   * separator, form one comma expression, and a comma expression is the group
   * of its terms' values, as it is at top level and in a group (#443). So
   * `{3, 4} ()` answers `(3, 4)`, as `3, 4` does. The group does not declare,
   * so its declarations land in the call's own frame, as top level's land in
   * the file: `{.a 1, .b 2; a + b} ()` is `3`.
   *
   * A body assembled programmatically from bare atoms, or from statements with
   * no recorded `;`, stays one juxtaposed expression, which is what the Frame
   * API has always meant by a multi-item body. A one-term body keeps its
   * existing value and representation either way, so a trailing separator
   * alone does not unwrap a single statement.
   */
  public static evaluateBody(
    body: readonly Frame[],
    input: EvaluationInput,
    sequence = false,
  ): Frame {
    const scope = EvaluationScope.from(input);
    if (body.length === 1) return FrameExpr.evaluateTerms(body, scope);
    if (!sequence) {
      return isCommaExpression(body)
        ? FrameExpr.commaGroup(body, scope)
        : FrameExpr.evaluateTerms(body, scope);
    }

    let result = Frame.nil;
    for (const run of commaRuns(body)) {
      const [item] = run;
      result = run.length > 1
        ? FrameExpr.commaGroup(run, scope)
        : item instanceof FrameExpr
        ? item.evaluate(scope)
        : item.in(scope);
      // A sequence stops at the first failing statement, because later
      // statements were written to run after the earlier ones succeeded.
      if (result.isFailedResult()) return result;
    }
    return result;
  }

  /**
   * The value of a comma expression: a group of its terms' values that
   * declares nothing of its own. Installed by `frame-group.ts`, which this
   * module cannot import without closing a cycle.
   */
  public static commaGroup: (
    terms: readonly Frame[],
    scope: EvaluationScope,
  ) => Frame;

  public override call(argument: Frame, parameter = Frame.nil): Frame {
    return this.in(EvaluationScope.call(argument, parameter));
  }

  public override isPlainExpression(): boolean {
    return Object.getPrototypeOf(this) === FrameExpr.prototype;
  }

  /** A parsed expression walks as its atoms (#429). */
  public override elements(): Frame[] {
    return atomsOf(this.data, sitesAround(this.data));
  }

  protected override sizeElements(): Frame[] | Frame {
    return sizeAtomsOf(this.data);
  }

  /** A parsed expression of one atom is that atom; anything else is itself. */
  public override walked(): Frame {
    if (!isPlainExpr(this)) return this;
    const atoms = atomsOf([this], sitesAround(this.data));
    return atoms.length === 1 ? atoms[0] : this;
  }

  /**
   * An expression or a closure is called, not collected, so its terms are code
   * rather than elements to concatenate: repetition applies it, as before.
   */
  public override repetitionFor(_count: bigint): Frame | undefined {
    return undefined;
  }

  public override toStringDataArray(): string[] {
    const body = this.data
      .map((obj: Frame) => renderNested(obj, () => obj.toString()))
      .join(" ");
    // Don't add separator here - let parent FrameList handle it
    return [body];
  }

  private static evaluateTerms(
    terms: readonly Frame[],
    scope: EvaluationScope,
  ): Frame {
    return terms.reduce((sum: Frame, item: Frame, index): Frame => {
      // A failed term is the result of the expression. In particular, a
      // missing dot-parameter read must not be replaced by the operator or
      // operand that follows it.
      if (sum.isFailedResult()) return sum;

      const value = item.in(resumedScope(item, scope));
      if (value.is.error === true) return value;
      if (
        index === 0 && value.isSymbol() && value.is.address &&
        Frame.SIZE_OPERATORS.includes(value.spelling())
      ) return value;
      // An explicit nil receiver still has a Size. The initial nil accumulator
      // is not a receiver, so a leading .## remains an address (#411).
      if (
        index > 0 && sum.is.void && value.isSymbol() &&
        value.is.address &&
        Frame.SIZE_OPERATORS.includes(value.spelling())
      ) {
        return value.called_by(sum);
      }
      if (index > 0 && value.is.operator === true) {
        return value.called_by(sum, Frame.nil).atSite(scope);
      }
      return sum.call(value);
    }, Frame.nil);
  }

  private schemaRetrieval(scope: EvaluationScope): Frame | undefined {
    if (
      this.data.length !== 2 || !this.data[0].isSymbol() ||
      !this.data[1].isName() || this.data[1].source !== "<^>"
    ) return undefined;
    return this.data[0].bindingSchema(resumedScope(this.data[0], scope));
  }

  private schemaDefinition(scope: EvaluationScope): Frame | undefined {
    if (!this.is.statement || this.data.length !== 2) return undefined;
    const name = unwrapSingleton(this.data[0]);
    const schema = unwrapSingleton(this.data[1]);
    if (!name.isName() || !schema.isSchema()) {
      return undefined;
    }
    const setter = name.in(scope);
    const value = schema.in(scope);
    if (!setter.isSymbol() || !value.isSchema()) {
      return Frame.error("$!.unsupported-schema-definition");
    }
    return setter.defineSchema(value);
  }

  private asStatement(result: Frame): Frame {
    if (!this.is.statement) return result;
    const statement = new FrameExpr([result]);
    statement.is.statement = true;
    statement.is.error = result.isFailedResult();
    // A terminated declaration is still a declaration. The wrapper carries that
    // so an aggregate can leave the echo out of its rendering without looking
    // inside every statement it holds.
    statement.is.declaration = result.is.declaration === true;
    return statement;
  }

  /** The value this frame answered, looking through a statement's wrapper. */
  public static answeredValue(term: Frame): Frame {
    return term.is.statement === true && term instanceof FrameExpr &&
        term.size() === 1
      ? term.asArray()[0]
      : term;
  }
}

/**
 * The parser's marker for a bind pipe, what one whitespace started. It names
 * the pipe only: a bind emits its one term bare, or several abutting terms as
 * a tight `FrameExpr`, so no `FrameBind` is ever a node of the graph (a16).
 */
export class FrameBind extends FrameExpr {
}

/** A parsed expression itself, not a closure or a bind. */
const isPlainExpr = (term: Frame): term is FrameExpr =>
  term instanceof FrameExpr &&
  Object.getPrototypeOf(term) === FrameExpr.prototype;

/**
 * A closure literal. `FrameLazy` is the one other subclass of `FrameExpr`, and
 * it cannot be imported here, because it extends this module's class.
 */
const isClosure = (term: Frame): term is FrameExpr =>
  term instanceof FrameExpr && !isPlainExpr(term);

/** The declarations a body can see, by spelling: each is its `FrameName` node. */
type Sites = ReadonlyMap<string, FrameName>;

/**
 * The declarations visible to each closure body a walk has passed through.
 *
 * A nested closure walks lazily, when a program walks the atom it is, so the
 * declarations around it are recorded as its enclosing body walks past it.
 * The key is the body's first term: a bound copy holds a fresh body array but
 * the same terms, and a body with no terms has no names to resolve.
 */
const enclosingSites = new WeakMap<Frame, Sites>();

/**
 * The atoms of parsed terms, in source order, as data (#429).
 *
 * The terms are a body's statements. Each statement's atoms are yielded in
 * order; a statement that ended in `;` is followed by the word `;`, and two
 * statements the source separated with `,` get the word `,` between them, so
 * the walk's text re-reads as the same source. A symbol, operator or name
 * becomes a word, so it never resolves. Every other atom is yielded itself,
 * unevaluated: a count, a string, a closure, an aggregate, or a tight
 * expression, terms that abut as `o.x` does, which is evaluated before its
 * neighbour applies and so is one atom that walks in turn (a16).
 *
 * Each word carries the declaration it resolves to, so `===` tells apart two
 * names with one spelling. A name at the head of a statement declares, and a
 * lookup resolves to the nearest declaration before it in its own body or in
 * a body around it, which is the order a call evaluates them in. A closure's
 * locals come ahead of its argument, so that is static. A name declared
 * nowhere it can see is free: it resolves per call, argument first (spec 7),
 * so its word carries no declaration.
 */
export function atomsOf(
  terms: readonly Frame[],
  sites: Sites = new Map(),
  resume?: EvaluationScope,
): Frame[] {
  const scope = new Map(sites);
  const atoms: Frame[] = [];
  const heads = new Set<Frame>();
  const declaredName = (expr: FrameExpr): FrameName | undefined => {
    const terms = expr.asArray();
    if (terms.length < 2) return undefined;
    const head = firstAtom(terms[0]);
    if (!head.isName() || /^\.*$/.test(head.source)) {
      return undefined;
    }
    heads.add(head);
    return head;
  };
  /** Records the declarations in view for a term that walks on its own. */
  const noteTerms = (held: readonly Frame[]): void => {
    if (held[0]) enclosingSites.set(held[0], scope);
    atomsOf(held, scope);
  };
  /** A compound atom resumes where its closure was bound, as a word does. */
  const scoped = (term: Frame): Frame =>
    resume ? new FrameScoped(term, resume) : term;
  const walkAtom = (term: Frame): void => {
    if (isPlainExpr(term)) {
      const held = term.asArray();
      if (held.length === 1) {
        walkAtom(held[0]);
      } else {
        noteTerms(held);
        atoms.push(scoped(term));
      }
    } else if (term.isName()) {
      atoms.push(
        FrameWord.address(term.source, heads.has(term) ? term : undefined),
      );
    } else if (term.isSymbol()) {
      const spelling = term.spelling();
      atoms.push(FrameWord.word(spelling, scope.get(spelling), resume));
    } else if (isClosure(term)) {
      const first = term.asArray()[0];
      if (first) enclosingSites.set(first, scope);
      atoms.push(scoped(term));
    } else if (resume && term.resolvesInScope()) {
      // An alias resolves its binding where it is evaluated, so it is held
      // with its closure's scope as a word is (spec a17).
      atoms.push(scoped(term));
    } else if (term instanceof FrameList) {
      // Keyed by its first element, which is how its own walk asks, and by
      // each element's first term, which is how a walked element asks.
      const [first] = term.asArray();
      if (first) enclosingSites.set(first, scope);
      for (const element of term.asArray()) {
        noteTerms(isPlainExpr(element) ? element.asArray() : [element]);
      }
      atoms.push(scoped(term));
    } else {
      atoms.push(term);
    }
  };
  let previous: Frame | undefined;
  for (const term of terms) {
    if (
      isPlainExpr(term) && previous && isPlainExpr(previous) &&
      previous.is.statement !== true
    ) {
      atoms.push(FrameWord.word(","));
    }
    if (isPlainExpr(term)) {
      const declared = declaredName(term);
      for (const inner of term.asArray()) walkAtom(inner);
      if (declared) scope.set(declared.source, declared);
      if (term.is.statement) atoms.push(FrameWord.word(";"));
    } else {
      walkAtom(term);
    }
    previous = term;
  }
  return atoms;
}

/**
 * The same represented words as a syntax walk, without recording scope sites or
 * binding names. Compound atoms stay whole; only trivial wrappers are unwrapped.
 * A malformed cyclic wrapper is refused before it can recurse forever.
 */
export function sizeAtomsOf(terms: readonly Frame[]): Frame[] | Frame {
  const atoms: Frame[] = [];
  let cyclic = false;
  const walkAtom = (term: Frame, path = new Set<Frame>()): void => {
    if (isPlainExpr(term) && term.size() === 1) {
      if (path.has(term)) {
        cyclic = true;
        return;
      }
      path.add(term);
      walkAtom(term.asArray()[0], path);
      path.delete(term);
    } else if (term.isName()) {
      atoms.push(FrameWord.address(term.source));
    } else if (term.isSymbol()) {
      atoms.push(FrameWord.word(term.spelling()));
    } else {
      atoms.push(term);
    }
  };
  let previous: Frame | undefined;
  for (const term of terms) {
    if (
      isPlainExpr(term) && previous && isPlainExpr(previous) &&
      !previous.is.statement
    ) {
      atoms.push(FrameWord.word(","));
    }
    if (isPlainExpr(term)) {
      for (const inner of term.asArray()) walkAtom(inner);
      if (term.is.statement) atoms.push(FrameWord.word(";"));
    } else {
      walkAtom(term);
    }
    previous = term;
  }
  return cyclic ? Frame.error("$!.cyclic-aggregate .##") : atoms;
}

/**
 * Whether a body's terms are one comma expression: two or more parsed terms
 * the source separated with `,`, rather than bare atoms or statements.
 */
function isCommaExpression(terms: readonly Frame[]): boolean {
  return terms.length > 1 &&
    terms.every((term) =>
      term.isPlainExpression() && term.is.statement !== true
    );
}

/**
 * A sequenced body split at its `;`s: each run is the terms of one statement,
 * a comma expression when it has more than one.
 */
function commaRuns(body: readonly Frame[]): Frame[][] {
  const runs: Frame[][] = [];
  let run: Frame[] = [];
  for (const term of body) {
    run.push(term);
    if (term.is.statement === true) {
      runs.push(run);
      run = [];
    }
  }
  if (run.length > 0) runs.push(run);
  return runs;
}

/** The atom a term begins with, through the parser's one-term wrappers. */
function firstAtom(term: Frame): Frame {
  let atom = term;
  while (isPlainExpr(atom) && atom.size() === 1) {
    atom = atom.asArray()[0];
  }
  return atom;
}

/**
 * Records the declarations around `inner`, a closure literal being evaluated
 * while `outer` is called. Walking `outer` records them for every closure it
 * holds, so a walk of `inner` sees the same names whether or not anything
 * walked `outer` first. It runs once per body.
 */
export function noteEnclosing(inner: FrameExpr, outer: FrameExpr): void {
  const first = inner.asArray()[0];
  if (first && !enclosingSites.has(first)) {
    // Walked for the sites it records, so without the scope wrappers.
    const body = outer.asArray();
    atomsOf(body, sitesAround(body));
  }
}

/**
 * A compound atom of a walk, a tight expression, an aggregate or a closure
 * written in a body, held with the scope its closure was bound in (spec a17).
 *
 * A walk is evaluation stopped before each term's last step, so what it holds
 * is what evaluation holds: the term, and where it would be evaluated. The term
 * is the template's own frame, so this is transparent. It prints, compares and
 * counts as the term, and walks as the term does with the scope passed on, so
 * a walk of a walk keeps resuming where the first closure was bound. Applying
 * it, or folding it, binds a closure there first.
 */
export class FrameScoped extends Frame {
  constructor(
    public readonly term: Frame,
    public readonly scope: EvaluationScope,
  ) {
    super();
  }

  /** The term, a closure bound where it would have been. */
  public live(): Frame {
    return isClosure(this.term) ? this.term.in(this.scope) : this.term;
  }

  public override referent(path = new Set<Frame>()): Frame {
    return this.referenceThrough(this.term, path);
  }

  public override elements(): Frame[] {
    const terms = this.term.asArray();
    return atomsOf(terms, sitesAround(terms), this.scope);
  }

  public override asArray(): Frame[] {
    return this.term.asArray();
  }

  public override walked(): Frame {
    return this;
  }

  public override sizeFor(key: string): Frame {
    return this.referent().sizeFor(key);
  }

  public override nativeSize(path: Set<Frame>): bigint | Frame {
    return this.referent().nativeSize(path);
  }

  /** Sizes as its term does, `.#`, `.##` and `.###`; anything else is applied. */
  public override call(
    argument: Frame,
    parameter: Frame = Frame.nil,
  ): Frame {
    if (
      argument.isSymbol() && argument.is.address === true &&
      Frame.SIZE_OPERATORS.includes(argument.spelling())
    ) {
      return this.sizeFor(argument.spelling());
    }
    return this.live().call(argument, parameter);
  }

  public override equals(other: Frame): Frame {
    return this.term.equals(other.referent());
  }

  public override isPlainExpression(): boolean {
    return this.term.isPlainExpression();
  }

  public override toString(): string {
    return this.term.toString();
  }

  public override dataString(): string {
    return this.term.dataString();
  }
}

/** Where a resumed term finishes evaluating: its closure's scope, past a site. */
type Resumption = {
  readonly scope: EvaluationScope;
  readonly site?: EvaluationScope;
};

// Keyed by a term made for one resumption, a fresh symbol or a plumbing copy,
// never a shared template, so two resumptions cannot see each other's scope.
const resumptions = new WeakMap<Frame, Resumption>();

/**
 * Marks `term`, made for one resumption, to finish evaluating in `scope` past
 * `site` (spec a17). The term keeps its own class, so every structural check
 * the evaluator makes on it still holds.
 */
export function resumeAt(
  term: Frame,
  scope: EvaluationScope,
  site?: EvaluationScope,
): Frame {
  resumptions.set(term, { scope, site });
  return term;
}

/** The scope a body's term evaluates in: its resumption's, or the body's. */
function resumedScope(term: Frame, scope: EvaluationScope): EvaluationScope {
  const resumption = resumptions.get(term);
  return resumption
    ? scope.resumedIn(resumption.site, resumption.scope)
    : scope;
}

/** A source aggregate walks as a body does. */
FrameList.walkSource = (terms) => atomsOf(terms, sitesAround(terms));
FrameList.sizeSource = sizeAtomsOf;

/** The declarations around a closure body, as far as a walk has seen them. */
export function sitesAround(body: readonly Frame[]): Sites {
  return (body[0] && enclosingSites.get(body[0])) ?? new Map();
}

function unwrapSingleton(frame: Frame): Frame {
  let result = frame;
  while (
    result instanceof FrameList && !result.isSchema() &&
    result.size() === 1
  ) {
    result = result.asArray()[0];
  }
  return result;
}
