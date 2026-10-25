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
    return atomsOf(this.data);
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
 * The atoms of parsed terms, in source order, as data (#429).
 *
 * The parser wraps each atom of a juxtaposition as `FrameBind` holding a
 * one-term `FrameExpr`, and those wrappers vanish here. A symbol, operator or
 * name becomes a word, so it never resolves. A term that ended in `;` is
 * followed by the word `;`, so the walk's text re-reads as the same source;
 * a `,` between terms is not kept. Any other atom, a count, a string, a
 * closure or an aggregate written in the body, is yielded itself, unevaluated,
 * and an aggregate walks in turn by the same rule.
 */
export function atomsOf(terms: readonly Frame[]): Frame[] {
  const atoms: Frame[] = [];
  for (const term of terms) {
    if (term instanceof FrameBind) {
      atoms.push(...atomsOf(term.asArray()));
    } else if (isPlainExpr(term)) {
      atoms.push(...atomsOf(term.asArray()));
      if (term.is.statement) atoms.push(FrameWord.word(";"));
    } else if (term instanceof FrameName) {
      atoms.push(FrameWord.address(term.source));
    } else if (term instanceof FrameSymbol) {
      atoms.push(FrameWord.word(term.spelling()));
    } else {
      atoms.push(term);
    }
  }
  return atoms;
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
