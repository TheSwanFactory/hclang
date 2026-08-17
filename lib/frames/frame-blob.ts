import type { Frame } from "./frame.ts";
import { FrameAtom } from "./frame-atom.ts";
import { NilContext } from "./context.ts";
import { completeAtEnd, includeOrEnd } from "./atom-syntax.ts";
import type { AtomSyntax, ScanResult, SigilStart } from "../scan.ts";

export interface IRegexpMap {
  [key: number]: RegExp;
}

export interface IPrefixMap {
  [key: number]: string;
}

export class FrameBlob extends FrameAtom {
  public static readonly BLOB_START = "0";
  public static readonly SIGIL_STARTS = [
    { key: FrameBlob.BLOB_START, mode: "atom" },
  ] as const satisfies readonly SigilStart[];
  public static readonly BLOB_DIGITS: IRegexpMap = {
    2: /[01]/,
    8: /[0-7]/,
    16: /[0-9a-fA-F]/,
    32: /[0-9a-hj-np-z]/,
    64: /[0-9a-zA-Z+/=]/,
  };

  public static readonly BLOB_PREFIX: IPrefixMap = {
    2: "b", // 1
    8: "o", // 3
    16: "x", // 4
    32: "t", // 5
    64: "s", // 6
  };

  public static readonly SYNTAX: AtomSyntax = {
    NAME: "FrameBlob",
    SIGIL_STARTS: FrameBlob.SIGIL_STARTS,
    recognize: (symbol: Frame, source = ""): ScanResult => {
      const char = symbol.toString();
      // The leading zero admits a base sigil or a decimal digit.
      if (source === "") {
        const prefixes = Object.values(FrameBlob.BLOB_PREFIX);
        return includeOrEnd(prefixes.includes(char) || /\d/.test(char));
      }

      const base = FrameBlob.find_base(`0${source}`);
      const digits = base === 10 ? /\d/ : FrameBlob.BLOB_DIGITS[base];
      return includeOrEnd(digits.test(char));
    },
    finish: completeAtEnd,
    fromSource: (source: string): Frame => new FrameBlob(source),
  };

  public static fix_source(source: string): string {
    if (source === "") {
      return "0" + FrameBlob.BLOB_PREFIX[16] + "0";
    }
    if (source[0] !== "0") {
      return "0" + source;
    }
    return source;
  }

  public static find_base(source: string): number {
    const prefix = source.substr(1, 1);
    const keys = Object.keys(FrameBlob.BLOB_PREFIX);
    const base = keys.find((k) =>
      FrameBlob.BLOB_PREFIX[parseInt(k, 10)] === prefix
    );
    return parseInt(base || "10", 10);
  }

  public static count_bits(source: string, base: number): bigint {
    const digits = source.substr(2);
    const length = digits.length;
    const entropy = Math.log2(base);
    const bits = length * entropy;
    return BigInt(bits);
  }

  protected data: bigint;
  protected base: number;
  protected n_bits: bigint;

  constructor(source: string) {
    super(NilContext);
    source = FrameBlob.fix_source(source);

    this.data = BigInt(source);
    this.base = FrameBlob.find_base(source);
    this.n_bits = FrameBlob.count_bits(source, this.base);
  }

  public override called_by(context: Frame, parameter: Frame): Frame {
    if (context instanceof FrameBlob) {
      const left_operand = context as FrameBlob;
      const result = left_operand.append(this);
      return result;
    }
    return super.called_by(context, parameter);
  }

  public override string_start(): string {
    return FrameBlob.BLOB_START;
  }

  public override string_prefix(): string {
    const sigil = FrameBlob.BLOB_PREFIX[this.base];
    return "0" + sigil;
  }

  public override toString(): string {
    const dataString = this.toData().toString(this.base);
    const pad = this.n_chars() - dataString.length;
    const digits = "0".repeat(pad) + dataString;
    return this.string_prefix() + digits + this.string_suffix();
  }

  /** The exact rendered width of this blob, including leading zero bits. */
  public bitLength(): number {
    return Number(this.n_bits);
  }

  /** Return an exact-width binary slice without changing this blob. */
  public sliceBits(offset: number, width: number): FrameBlob {
    if (
      !Number.isInteger(offset) || !Number.isInteger(width) || offset < 0 ||
      width <= 0 || offset + width > this.bitLength()
    ) {
      throw new RangeError(`Invalid bit slice: ${offset}..${offset + width}`);
    }
    const remaining = this.bitLength() - offset - width;
    const mask = (1n << BigInt(width)) - 1n;
    const value = (this.data >> BigInt(remaining)) & mask;
    const digits = value.toString(2).padStart(width, "0");
    return new FrameBlob(`0b${digits}`);
  }

  protected override toData(): bigint {
    return this.data;
  }

  protected append(right_operand: FrameBlob): FrameBlob {
    const left = BigInt(right_operand.exalt(this));
    this.data = left + right_operand.data;
    this.n_bits = this.n_bits + right_operand.n_bits;
    return this;
  }

  protected exalt(left_operand: FrameBlob): bigint {
    const result = left_operand.shift_left(this.n_bits);
    return result;
  }

  protected shift_left(n_bits: bigint): bigint {
    const bigint_result = this.data << n_bits;
    return bigint_result;
  }

  protected n_chars(): number {
    const entropy = Math.log2(this.base);
    const bits = Number(this.n_bits);
    const chars = bits / entropy;
    return Math.ceil(chars);
  }
}
