import { Frame } from "./frame.ts";
import { FrameList } from "./frame-list.ts";
import { FrameName } from "./frame-name.ts";
import { FrameSchema } from "./frame-schema.ts";
import { FrameSymbol } from "./frame-symbol.ts";
import { NilContext } from "./context.ts";

export class FrameExpr extends FrameList {
  constructor(data: Array<Frame>, meta = NilContext) {
    super(data, meta);
    data.forEach((item) => {
      item.up = this;
    });
  }

  public override in(contexts = [Frame.nil]): Frame {
    const retrieval = this.schemaRetrieval(contexts);
    if (retrieval) return this.asStatement(retrieval);

    const definition = this.schemaDefinition(contexts);
    if (definition) return this.asStatement(definition);

    contexts.push(this);
    const result = this.data.reduce((sum: Frame, item: Frame, index): Frame => {
      const value = item.in(contexts);
      if (index > 0 && value.is.operator === true) {
        return value.called_by(sum, Frame.nil);
      }
      const next_sum = sum.call(value);
      return next_sum;
    }, Frame.nil);

    return this.asStatement(result);
  }

  public override call(argument: Frame, parameter = Frame.nil): Frame {
    return this.in([argument, parameter]);
  }

  public override toStringDataArray(): string[] {
    const body = this.data.map((obj: Frame) => obj.toString()).join(" ");
    // Don't add separator here - let parent FrameList handle it
    return [body];
  }

  private schemaRetrieval(contexts: Frame[]): Frame | undefined {
    if (
      this.data.length !== 2 || !(this.data[0] instanceof FrameSymbol) ||
      !(this.data[1] instanceof FrameName) || this.data[1].source !== "<>"
    ) return undefined;
    return this.data[0].bindingSchema(contexts);
  }

  private schemaDefinition(contexts: Frame[]): Frame | undefined {
    if (!this.is.statement || this.data.length !== 2) return undefined;
    const name = unwrapSingleton(this.data[0]);
    const schema = unwrapSingleton(this.data[1]);
    if (!(name instanceof FrameName) || !(schema instanceof FrameSchema)) {
      return undefined;
    }
    const scoped = [...contexts, this];
    const setter = name.in(scoped);
    const value = schema.in(scoped);
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
