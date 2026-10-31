import { type Any, Frame } from "./frame.ts";
import { NilContext } from "./context.ts";

export class FrameAtom extends Frame {
  constructor(meta = NilContext) {
    super(meta);
  }

  /**
   * A void atom, such as a comment, keeps an explicit Count zero; only nil
   * itself has no Count (011.18k).
   */
  public override sizeFor(key: string): Frame {
    if (key === Frame.kCOUNT && this.is.void) {
      return this.observationError() ?? Frame.count(0n);
    }
    return super.sizeFor(key);
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
