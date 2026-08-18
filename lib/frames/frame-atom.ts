import { type Any, Frame } from "./frame.ts";
import { NilContext } from "./context.ts";

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
 * Marker for an atom delimited by an explicit prefix and suffix.
 *
 * The distinction from a bare atom is real: a delimited atom knows where it ends
 * from its own spelling, and asymmetric delimiters nest by matching pairs. That
 * nesting rule is recognition, so it lives beside the syntax descriptors in
 * `atom-syntax.ts` rather than on the value.
 */
export class FrameQuote extends FrameAtom {
}
