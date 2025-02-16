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

  protected toData(): Any {
    return null;
  }

  public equals(right: FrameAtom): Any {
    return this.toString() === right.toString() ? Frame.all : Frame.nil;
  }
}

export class FrameQuote extends FrameAtom {
}
