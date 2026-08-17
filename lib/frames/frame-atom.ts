import { type Any, Frame } from "./frame.ts";
import { NilContext } from "./context.ts";
import { nestingDepth } from "./atom-syntax.ts";

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
  /** Unclosed interior prefixes already consumed into `source`. */
  public nestingDepth(source: string): number {
    return nestingDepth(source, this.string_prefix(), this.string_suffix());
  }
}
