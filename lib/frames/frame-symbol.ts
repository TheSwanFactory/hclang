import { Frame } from "./frame.ts";
import { FrameAtom } from "./frame-atom.ts";
import { FrameNote } from "./frame-note.ts";
import { FrameHandle } from "./frame-handle.ts";
import { FrameArray } from "./frame-array.ts";
import { FrameSchema } from "./frame-schema.ts";
import { type Context, NilContext } from "./context.ts";
import { ScanDisposition, type ScanResult, type SigilStart } from "../scan.ts";

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
  public static readonly SIGIL_STARTS: readonly SigilStart[] = [
    { key: FrameSymbol.SYMBOL_BEGIN.toString(), mode: "atom" },
  ];

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
      const explicitOrigin = this.get_here(Frame.kOUT);
      const origin =
        context instanceof FrameHandle && !explicitOrigin.is.missing
          ? explicitOrigin
          : context;
      const value = context.get(this.data, origin);
      if (!value.is.missing) {
        if (value.is.error) return value;
        value.up = context;
        if (value.is.immediate === true) {
          return value.call(context);
        }
        return value instanceof FrameArray
          ? new FrameHandle(value, this.data.endsWith("_"))
          : value;
      }
    }
    return FrameNote.key(first.id + "." + this.data, first);
  }

  public override apply(argument: Frame, _parameter: Frame): Frame {
    const out = this.get(Frame.kOUT);
    if (argument instanceof FrameHandle) {
      argument = argument.unwrap();
    }
    const binding = out.resolve_here(this.data, out);
    if (binding?.value.is.error) return binding.value;
    const assignmentKey = binding?.key ?? this.data;
    const schemaKey = `${assignmentKey}.<>`;

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

    const previous = binding?.value ?? out.get_here(this.data, out);
    if (!previous.is.missing && this.isConstant(assignmentKey)) {
      return new FrameLiteral(`$error{$is-constant .${this.data}}`);
    }

    out.set(assignmentKey, argument);
    return previous.is.missing
      ? new FrameLiteral(`.${this.data} ${argument.toString()}`)
      : argument;
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

  private isConstant(key = this.data): boolean {
    return /^_*\p{Lu}/u.test(key);
  }
}

export class FrameOperator extends FrameSymbol {
  public static readonly OPERATOR_START = /[&|?:+\-/*%=!]/;
  public static override readonly SIGIL_STARTS: readonly SigilStart[] = [
    { key: FrameOperator.OPERATOR_START.toString(), mode: "atom" },
  ];
  public readonly operator: string;

  constructor(source: string, meta: Context = NilContext) {
    super(source, meta);
    this.operator = source;
    this.is.operator = true;
  }

  public static operator_chars(): string {
    return "&|?:+\\-*%<>!";
    // FrameOperator.OPERATOR_CHARS.source.slice(1, -1)
  }

  public static Accepts(char: string): boolean {
    return FrameOperator.OPERATOR_CHARS.test(char);
  }

  public override in(_contexts: Frame[] = [Frame.nil]): Frame {
    return this;
  }

  public override called_by(context: Frame): Frame {
    return FrameSymbol.for(this.data).called_by(context);
  }

  public override string_start(): string {
    return FrameOperator.OPERATOR_CHARS.toString();
  }

  public override canInclude(char: string): boolean {
    return FrameOperator.Accepts(char);
  }

  public override scan(symbol: Frame, _source = ""): ScanResult {
    const char = symbol.toString();
    if (char === "<" || char === ">") {
      return { disposition: ScanDisposition.CompleteRedispatch };
    }
    return {
      disposition: this.canInclude(char)
        ? ScanDisposition.Consume
        : ScanDisposition.CompleteRedispatch,
    };
  }
}
