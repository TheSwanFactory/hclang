import { type Any, Frame } from "./frame.ts";
import { NilContext } from "./context.ts";
import { ScanDisposition, type ScanResponse } from "../scan.ts";

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

export class FrameQuote extends FrameAtom {
  public override scan(symbol: Frame, _source = ""): ScanResponse {
    return {
      disposition: symbol.toString() === this.string_suffix()
        ? ScanDisposition.CompleteConsume
        : ScanDisposition.Consume,
    };
  }

  public override finishInput(source = ""): ScanResponse {
    return {
      disposition: ScanDisposition.Error,
      message:
        `unterminated ${this.className()}: ${this.string_prefix()}${source}`,
    };
  }
}
