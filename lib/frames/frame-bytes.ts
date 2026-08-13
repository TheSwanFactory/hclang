import { FrameAtom, FrameQuote } from "./frame-atom.ts";
import { type Context, NilContext } from "./context.ts";
import { Frame } from "./frame.ts";
import { ScanDisposition, type ScanResult, type SigilStart } from "../scan.ts";

export class FrameBytes extends FrameQuote {
  public static readonly BYTES_BEGIN = "\\";
  public static readonly BYTES_END = "\\";
  public static readonly SIGIL_STARTS = [
    { key: FrameBytes.BYTES_BEGIN, mode: "atom" },
  ] as const satisfies readonly SigilStart[];

  protected data: Uint8Array;
  protected length: number;

  constructor(values: number[] | string, meta: Context = NilContext) {
    super(meta);
    const bytes = typeof values === "string" ? [] : values;
    this.data = new Uint8Array(bytes);
    this.length = bytes.length;
  }

  public override string_prefix(): string {
    return FrameBytes.BYTES_BEGIN;
  }

  public override string_suffix(): string {
    return FrameBytes.BYTES_END;
  }

  public override toStringData(): string {
    return this.string_prefix() + this.length + this.string_suffix() +
      this.toData();
  }

  public override scan(symbol: Frame, source = ""): ScanResult {
    const char = symbol.toString();
    if (/\d/.test(char)) {
      return { disposition: ScanDisposition.Consume };
    }
    if (char !== FrameBytes.BYTES_END || source === "") {
      return {
        disposition: ScanDisposition.Error,
        message: `invalid byte length: \\${source}${char}`,
      };
    }

    const count = parseInt(source, 10);
    return count === 0
      ? {
        disposition: ScanDisposition.CompleteConsume,
        frame: new FrameBytes([]),
      }
      : {
        disposition: ScanDisposition.Transition,
        frame: new FrameBytePayload(count),
      };
  }

  public override finishInput(source = ""): ScanResult {
    return {
      disposition: ScanDisposition.Error,
      message: `unterminated byte length: \\${source}`,
    };
  }

  protected override toData(): string {
    let s = "";
    this.data.forEach((value) => {
      s = s + String.fromCharCode(value);
    });
    return s;
  }
}

/** Fixed-count payload state selected after `\\<length>\\`. */
export class FrameBytePayload extends FrameAtom {
  constructor(public readonly count: number) {
    super();
    this.is.lexical = true;
  }

  public override scan(symbol: Frame, source = ""): ScanResult {
    const payload = source + symbol.toString();
    if (payload.length < this.count) {
      return { disposition: ScanDisposition.Consume };
    }

    const bytes = Array.from(payload, (char) => char.charCodeAt(0));
    return {
      disposition: ScanDisposition.CompleteConsume,
      frame: new FrameBytes(bytes),
    };
  }

  public override finishInput(source = ""): ScanResult {
    return {
      disposition: ScanDisposition.Error,
      message: `byte payload shorter than ${this.count}: ${source}`,
    };
  }
}
