import { FrameQuote } from "./frame-atom.ts";
import { type Context, NilContext } from "./meta-frame.ts";

export class FrameBytes extends FrameQuote {
  public static readonly BYTES_BEGIN = "\\";
  public static readonly BYTES_END = "\\";

  protected data: Uint8Array;
  protected length: number;

  constructor(values: number[], meta: Context = NilContext) {
    super(meta);
    this.data = new Uint8Array(values);
    this.length = values.length;
  }

  public override string_prefix() {
    return FrameBytes.BYTES_BEGIN;
  }

  public override string_suffix() {
    return FrameBytes.BYTES_END;
  }

  public override toStringData(): string {
    return this.string_prefix() + this.length + this.string_suffix() +
      this.toData();
  }

  protected override toData() {
    let s = "";
    this.data.forEach((value) => {
      s = s + String.fromCharCode(value);
    });
    return s;
  }
}
