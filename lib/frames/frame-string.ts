import type { Frame } from "./frame.ts";
import { type FrameAtom, FrameQuote } from "./frame-atom.ts";
import { FrameSymbol } from "./frame-symbol.ts";
import { NilContext } from "./context.ts";
import type { Context } from "./context.ts";
import { sigilizer } from "../execute/sigilizer.ts";
import type { SigilStart } from "../scan.ts";

const reducer = (current: Frame, char: string): Frame => {
  const symbol = FrameSymbol.for(char);
  const result = sigilizer.scan(current, symbol);
  return result;
};

export interface IStringConstructor {
  new (data: string, meta: Context): FrameAtom;
}

/**
 * The canonical HC string.
 *
 * `“ ”` denotes its own characters and nests without escapes. `"` is the ASCII
 * input spelling of the same value: its maximal run selects nesting depth
 * rather than a second string type, and the completed value always prints with
 * curly quotes, so the alias is erased by round-tripping.
 */
export class FrameString extends FrameQuote {
  public static readonly STRING_BEGIN = "“";
  public static readonly STRING_END = "”";
  public static readonly ASCII_QUOTE = '"';
  public static readonly SIGIL_STARTS: readonly SigilStart[] = [
    { key: FrameString.STRING_BEGIN, mode: "atom" },
    { key: FrameString.ASCII_QUOTE, mode: "run" },
  ];
  public static readonly RUN_DELIMITER: string = FrameString.ASCII_QUOTE;
  public static readonly RUN_LABEL: string = "quoted";

  /** Builds one string from an ASCII-quoted body; depth is not retained. */
  public static fromRun(body: string, _runLength: number): FrameString {
    return new FrameString(body);
  }

  constructor(protected data: string, meta: Context = NilContext) {
    super(meta);
  }

  public override apply(argument: FrameAtom): FrameString {
    let value = argument.toString();
    if (argument instanceof FrameString) {
      value = argument.data;
    }
    return new FrameString(this.data + value);
  }

  public override string_prefix(): string {
    return FrameString.STRING_BEGIN;
  }

  public override string_suffix(): string {
    return FrameString.STRING_END;
  }

  public reduce(starter: Frame, finish = true): Frame {
    const final = this.data.split("").reduce(reducer, starter);
    return finish ? sigilizer.scan(final, FrameSymbol.end()) : final;
  }

  protected override toData(): string {
    return this.data;
  }
}
