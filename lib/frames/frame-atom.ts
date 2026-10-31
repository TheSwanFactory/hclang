import { type Any, Frame } from "./frame.ts";
import { NilContext } from "./context.ts";

export class FrameAtom extends Frame {
  constructor(meta = NilContext) {
    super(meta);
  }

  /** R1 (011.18h): an atom's residual is the parity of its Count. */
  public override sizeFor(key: string): Frame {
    if (key !== Frame.kRESIDUAL) return super.sizeFor(key);
    const n = this.sizeFor(Frame.kCOUNT);
    if (n.observationError()) return n;
    const data = (n as unknown as { data?: unknown }).data;
    return typeof data === "bigint" ? Frame.signed(data % 2n) : Frame.nil;
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
