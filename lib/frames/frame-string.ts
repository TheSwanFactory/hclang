import type { Frame } from "./frame.ts";
import { FrameAtom, FrameQuote } from "./frame-atom.ts";
import { FrameSymbol } from "./frame-symbol.ts";
import { NilContext } from "./context.ts";
import type { Context } from "./context.ts";
import { sigilizer } from "../execute/sigilizer.ts";
import { quoteRecognizer, unterminatedAtEnd } from "./atom-syntax.ts";
import {
  type AtomSyntax,
  type RunSyntax,
  ScanDisposition,
  type ScanResult,
  type SigilStart,
} from "../scan.ts";

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
  /** String bodies are HC data, spelled two ways; they are not foreign text. */
  public static readonly RUN_OPAQUE: boolean = false;

  /** Builds one string from an ASCII-quoted body; depth is not retained. */
  public static fromRun(body: string, _runLength: number): FrameString {
    return new FrameString(body);
  }

  /** One family, two spellings: a nesting atom and a run-delimited alias. */
  public static readonly SYNTAX: AtomSyntax & RunSyntax = {
    NAME: "FrameString",
    SIGIL_STARTS: FrameString.SIGIL_STARTS,
    recognize: quoteRecognizer(
      FrameString.STRING_BEGIN,
      FrameString.STRING_END,
    ),
    finish: unterminatedAtEnd("FrameString", FrameString.STRING_BEGIN),
    fromSource: (source: string): Frame => new FrameString(source),
    RUN_DELIMITER: FrameString.RUN_DELIMITER,
    RUN_LABEL: FrameString.RUN_LABEL,
    RUN_OPAQUE: FrameString.RUN_OPAQUE,
    fromRun: FrameString.fromRun,
  };

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

/**
 * A closing quote with no string to close.
 *
 * Because an interior `”` at depth zero completes its string, a later `”` can
 * only mean the string ended earlier than the author intended. Reporting it
 * keeps that mistake from silently truncating a value, or from being absorbed
 * as an argument to the string that closed too soon.
 */
export class FrameStringEnd extends FrameAtom {
  public static readonly SIGIL_STARTS: readonly SigilStart[] = [
    { key: FrameString.STRING_END, mode: "atom" },
  ];

  /** Recognition always fails, so this family never builds a value. */
  public static readonly SYNTAX: AtomSyntax = {
    NAME: "FrameStringEnd",
    SIGIL_STARTS: FrameStringEnd.SIGIL_STARTS,
    recognize: (): ScanResult => FrameStringEnd.unmatched(),
    finish: (): ScanResult => FrameStringEnd.unmatched(),
    fromSource: (): Frame => {
      throw new Error("unmatched string terminator has no value");
    },
  };

  public static unmatched(): ScanResult {
    return {
      disposition: ScanDisposition.Error,
      message: `unmatched string terminator: ${FrameString.STRING_END}`,
    };
  }
}
