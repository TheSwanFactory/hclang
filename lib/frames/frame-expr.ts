import { Frame } from "./frame.ts";
import { FrameList } from "./frame-list.ts";
import { FrameName } from "./frame-name.ts";
import { FrameSchema } from "./frame-schema.ts";
import { FrameSymbol } from "./frame-symbol.ts";
import { NilContext } from "./context.ts";
import { type EvaluationInput, EvaluationScope } from "./evaluation-scope.ts";

export class FrameExpr extends FrameList {
  constructor(data: Array<Frame>, meta = NilContext) {
    // Syntax containment is not lexical ancestry. In particular, closure calls
    // may evaluate these shared items repeatedly without re-parenting them.
    super(data, meta);
  }

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
   * Evaluates a closure body as a sequence and returns its last statement.
   * Without a statement separator, a programmatically constructed body remains
   * one ordinary expression for compatibility with the Frame API.
   */
  public static evaluateBody(
    body: readonly Frame[],
    input: EvaluationInput,
  ): Frame {
    const scope = EvaluationScope.from(input);
    if (
      body.length === 1 ||
      !body.some((item) => item.is.statement === true)
    ) {
      return FrameExpr.evaluateTerms(body, scope);
    }

    let result = Frame.nil;
    for (const item of body) {
      result = item instanceof FrameExpr
        ? item.evaluate(scope)
        : item.in(scope);
      if (result.is.error) return result;
    }
    return result;
  }

  public override call(argument: Frame, parameter = Frame.nil): Frame {
    return this.in(EvaluationScope.call(argument, parameter));
  }

  public override toStringDataArray(): string[] {
    const body = this.data.map((obj: Frame) => obj.toString()).join(" ");
    // Don't add separator here - let parent FrameList handle it
    return [body];
  }

  private static evaluateTerms(
    terms: readonly Frame[],
    scope: EvaluationScope,
  ): Frame {
    return terms.reduce((sum: Frame, item: Frame, index): Frame => {
      const value = item.in(scope);
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
    statement.is.error = result.is.error === true;
    return statement;
  }
}

export class FrameBind extends FrameExpr {
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
