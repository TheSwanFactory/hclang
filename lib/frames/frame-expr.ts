import { Frame } from "./frame.ts";
import { FrameList } from "./frame-list.ts";
import { FrameName } from "./frame-name.ts";
import { FrameSchema } from "./frame-schema.ts";
import { FrameSymbol } from "./frame-symbol.ts";
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
   * Evaluates a closure body, as a sequence when the source asked for one.
   *
   * `sequence` records that the author wrote `;` between terms, so intent comes
   * from the parser rather than from inspecting flags on the body's children. A
   * body assembled programmatically therefore stays one juxtaposed expression,
   * which is what the Frame API has always meant by a multi-item body.
   *
   * A one-term body keeps its existing value and representation either way, so
   * a trailing separator alone does not unwrap a single statement.
   */
  public static evaluateBody(
    body: readonly Frame[],
    input: EvaluationInput,
    sequence = false,
  ): Frame {
    const scope = EvaluationScope.from(input);
    if (body.length === 1 || !sequence) {
      return FrameExpr.evaluateTerms(body, scope);
    }

    let result = Frame.nil;
    for (const item of body) {
      result = item instanceof FrameExpr
        ? item.evaluate(scope)
        : item.in(scope);
      // A sequence stops at the first failing statement, because later
      // statements were written to run after the earlier ones succeeded.
      if (result.isFailedResult()) return result;
    }
    return result;
  }

  public override call(argument: Frame, parameter = Frame.nil): Frame {
    return this.in(EvaluationScope.call(argument, parameter));
  }

  /** A parsed expression walks as its atoms (#429). */
  public override elements(): Frame[] {
    return atomsOf(this.data, sitesAround(this.data));
  }

  /** A parsed expression of one atom is that atom; anything else is itself. */
  public override walked(): Frame {
    if (!isPlainExpr(this) && !((this as Frame) instanceof FrameBind)) {
      return this;
    }
    const atoms = atomsOf([this]);
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

      const value = item.in(scope);
      if (value.is.error === true) return value;
      if (index > 0 && value.is.operator === true) {
        return value.called_by(sum, Frame.nil);
      }
      return sum.call(value);
    }, Frame.nil);
  }

  private schemaRetrieval(scope: EvaluationScope): Frame | undefined {
    if (
      this.data.length !== 2 || !(this.data[0] instanceof FrameSymbol) ||
      !(this.data[1] instanceof FrameName) || this.data[1].source !== "<>"
    ) return undefined;
    return this.data[0].bindingSchema(scope);
  }

  private schemaDefinition(scope: EvaluationScope): Frame | undefined {
    if (!this.is.statement || this.data.length !== 2) return undefined;
    const name = unwrapSingleton(this.data[0]);
    const schema = unwrapSingleton(this.data[1]);
    if (!(name instanceof FrameName) || !(schema instanceof FrameSchema)) {
      return undefined;
    }
    const setter = name.in(scope);
    const value = schema.in(scope);
    if (!(setter instanceof FrameSymbol) || !(value instanceof FrameSchema)) {
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
  term instanceof FrameExpr && !isPlainExpr(term) &&
  !((term as Frame) instanceof FrameBind);

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
 * The parser wraps each atom of a juxtaposition as `FrameBind` holding a
 * one-term `FrameExpr`, and those wrappers vanish here. A symbol, operator or
 * name becomes a word, so it never resolves. A term that ended in `;` is
 * followed by the word `;`, so the walk's text re-reads as the same source;
 * a `,` between terms is not kept. Any other atom, a count, a string, a
 * closure or an aggregate written in the body, is yielded itself, unevaluated,
 * and an aggregate walks in turn by the same rule.
 *
 * Each word carries the declaration it resolves to, so `===` tells apart two
 * names with one spelling. A name at the head of an expression declares, and
 * a lookup resolves to the nearest declaration before it in its own body or in
 * a body around it, which is the order a call evaluates them in. A closure's
 * locals come ahead of its argument, so that is static. A name declared
 * nowhere it can see is free: it resolves per call, argument first (spec 7),
 * so its word carries no declaration.
 */
export function atomsOf(
  terms: readonly Frame[],
  sites: Sites = new Map(),
): Frame[] {
  const scope = new Map(sites);
  const atoms: Frame[] = [];
  const walk = (term: Frame): void => {
    if (term instanceof FrameBind) {
      for (const inner of term.asArray()) walk(inner);
    } else if (isPlainExpr(term)) {
      const declared = declaredName(term);
      for (const inner of term.asArray()) walk(inner);
      if (declared) scope.set(declared.source, declared);
      if (term.is.statement) atoms.push(FrameWord.word(";"));
    } else if (term instanceof FrameName) {
      // A name at the head of an expression is its own declaration. Anywhere
      // else it is a value or a member, `o .a`, which no local declares.
      atoms.push(
        FrameWord.address(term.source, heads.has(term) ? term : undefined),
      );
    } else if (term instanceof FrameSymbol) {
      const spelling = term.spelling();
      atoms.push(FrameWord.word(spelling, scope.get(spelling)));
    } else {
      const first = isClosure(term) ? term.asArray()[0] : undefined;
      if (first) enclosingSites.set(first, scope);
      atoms.push(term);
    }
  };
  const heads = new Set<Frame>();
  const declaredName = (expr: FrameExpr): FrameName | undefined => {
    const terms = expr.asArray();
    if (terms.length < 2) return undefined;
    const head = firstAtom(terms[0]);
    if (!(head instanceof FrameName) || /^\.*$/.test(head.source)) {
      return undefined;
    }
    heads.add(head);
    return head;
  };
  for (const term of terms) walk(term);
  return atoms;
}

/** The atom a term begins with, through the parser's one-term wrappers. */
function firstAtom(term: Frame): Frame {
  let atom = term;
  while (
    (atom instanceof FrameBind || isPlainExpr(atom)) && atom.size() === 1
  ) {
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
  if (first && !enclosingSites.has(first)) outer.elements();
}

/** The declarations around a closure body, as far as a walk has seen them. */
export function sitesAround(body: readonly Frame[]): Sites {
  return (body[0] && enclosingSites.get(body[0])) ?? new Map();
}

function unwrapSingleton(frame: Frame): Frame {
  let result = frame;
  while (
    result instanceof FrameList && !(result instanceof FrameSchema) &&
    result.size() === 1
  ) {
    result = result.asArray()[0];
  }
  return result;
}
