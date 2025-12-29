import { Frame } from "./frame.ts";
import { FrameAtom } from "./frame-atom.ts";
import { FrameNote } from "./frame-note.ts";
import { FrameSchema } from "./frame-schema.ts";
import { type Context, NilContext } from "./context.ts";

class FrameLiteral extends FrameAtom {
  constructor(protected data: string) {
    super(NilContext);
  }

  protected override toData(): string {
    return this.data;
  }
}

export class FrameSymbol extends FrameAtom {
  public static readonly SYMBOL_BEGIN = /[a-zA-Z]/;
  public static readonly SYMBOL_CHAR = /[-\w]/;
  public static readonly OPERATOR_CHARS = /[&|?:+\-/*%=<>!]/;

  public static for(symbol: string): FrameSymbol {
    const exists = FrameSymbol.symbols[symbol];
    return exists || (FrameSymbol.symbols[symbol] = new FrameSymbol(symbol));
  }

  public static end(): FrameSymbol {
    return FrameSymbol.for(Frame.kEND);
  }

  protected static symbols: { [key: string]: FrameSymbol } = {};

  constructor(protected data: string, meta: Context = NilContext) {
    super(meta);
  }

  public override in(contexts: Frame[] = [Frame.nil]): Frame {
    const first = contexts[0];
    for (const context of contexts) {
      const value = context.get(this.data);
      if (!value.is.missing) {
        value.up = context;
        if (value.is.immediate === true) {
          return value.call(context);
        }
        return value;
      }
    }
    return FrameNote.key(first.id + "." + this.data, first);
  }

  public override apply(argument: Frame, _parameter: Frame): Frame {
    const out = this.get(Frame.kOUT);
    const schemaKey = `${this.data}.<>`;

    if (argument instanceof FrameSchema) {
      out.set(schemaKey, argument);
      return this;
    }

    const schema = out.get(schemaKey);
    if (!schema.is.missing && !this.matchesSchema(schema, argument)) {
      return new FrameLiteral(
        `$!.type-error .${this.data} ${schema.toString()} ${argument.toString()}`,
      );
    }

    out.set(this.data, argument);
    return new FrameLiteral(`.${this.data} ${argument.toString()}`);
  }

  public setter(out: Frame): FrameSymbol {
    const meta: Context = {};
    if (!out.is.void) {
      meta[Frame.kOUT] = out;
    }
    const setter = new FrameSymbol(this.data, meta);
    return setter;
  }

  public override called_by(context: Frame): Frame {
    return this.in([context]);
  }

  public override string_start(): string {
    return FrameSymbol.SYMBOL_BEGIN.toString();
  }

  public override canInclude(char: string): boolean {
    return FrameSymbol.SYMBOL_CHAR.test(char);
  }

  protected override toData(): string {
    return this.data === "$$" ? "\n" : this.data;
  }

  private matchesSchema(schema: Frame, value: Frame): boolean {
    if (!(schema instanceof FrameSchema)) {
      return true;
    }
    if (schema.length() === 0) {
      return true;
    }
    return schema.asArray().some((capture) =>
      capture.toString() === value.toString()
    );
  }
}

export class FrameOperator extends FrameSymbol {
  public static operator_chars(): string {
    return "&|?:+\\-*%<>!";
    // FrameOperator.OPERATOR_CHARS.source.slice(1, -1)
  }

  public static Accepts(char: string): boolean {
    return FrameOperator.OPERATOR_CHARS.test(char);
  }

  public override in(_contexts: Frame[] = [Frame.nil]): Frame {
    return FrameSymbol.for(this.data);
  }

  public override string_start(): string {
    return FrameOperator.OPERATOR_CHARS.toString();
  }

  public override canInclude(char: string): boolean {
    return FrameOperator.Accepts(char);
  }
}
