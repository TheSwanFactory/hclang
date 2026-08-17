import { type Any, Frame } from "./frame.ts";
import { NilContext } from "./context.ts";
import { ScanDisposition, type ScanResponse } from "../scan.ts";

/** Counts non-overlapping occurrences of `token` in `source`. */
const occurrences = (source: string, token: string): number =>
  source.split(token).length - 1;

export class FrameAtom extends Frame {
  constructor(meta = NilContext) {
    super(meta);
  }

  public string_prefix(): string {
    return "";
  }

  public string_suffix(): string {
    return "";
  }

  public string_start(): string {
    return this.string_prefix();
  }

  public toStringData(): string {
    const data = this.toData();
    const dataString = data == null ? "" : data.toString();
    return this.string_prefix() + dataString + this.string_suffix();
  }

  public override dataString(): string {
    return this.toStringData();
  }

  public override toString(): string {
    const dataString = this.toStringData();
    const n = this.meta_length();
    if ((n === 0) || (n === 1 && this.meta[Frame.kOUT])) {
      return dataString;
    }
    return this.string_open() + [dataString, this.meta_string()].join(", ") +
      this.string_close();
  }

  public canInclude(char: string): boolean {
    return char !== this.string_suffix();
  }

  public override scan(
    symbol: Frame,
    _source = "",
    _context: Frame = Frame.nil,
  ): ScanResponse {
    return {
      disposition: this.canInclude(symbol.toString())
        ? ScanDisposition.Consume
        : ScanDisposition.CompleteRedispatch,
    };
  }

  public override finishInput(_source = ""): ScanResponse {
    return { disposition: ScanDisposition.CompleteRedispatch };
  }

  protected toData(): Any {
    return null;
  }
}

/**
 * Atom delimited by an explicit prefix and suffix.
 *
 * Asymmetric delimiters nest without an escape character: an interior prefix
 * increments depth, an interior suffix decrements it, and only a suffix at
 * depth zero completes the atom. Symmetric delimiters cannot nest, so the
 * first suffix always completes them.
 */
export class FrameQuote extends FrameAtom {
  public override scan(symbol: Frame, source = ""): ScanResponse {
    if (symbol.toString() !== this.string_suffix()) {
      return { disposition: ScanDisposition.Consume };
    }
    return {
      disposition: this.nestingDepth(source) > 0
        ? ScanDisposition.Consume
        : ScanDisposition.CompleteConsume,
    };
  }

  /** Unclosed interior prefixes already consumed into `source`. */
  public nestingDepth(source: string): number {
    const prefix = this.string_prefix();
    const suffix = this.string_suffix();
    if (prefix === "" || prefix === suffix) {
      return 0;
    }
    return occurrences(source, prefix) - occurrences(source, suffix);
  }

  public override finishInput(source = ""): ScanResponse {
    return {
      disposition: ScanDisposition.Error,
      message:
        `unterminated ${this.className()}: ${this.string_prefix()}${source}`,
    };
  }
}
