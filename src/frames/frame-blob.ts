import * as _ from "lodash";
import { Frame } from "./frame";
import { FrameAtom } from "./frame-atom";
import { NilContext } from "./meta-frame";

export interface IRegexpMap {
  [key: number]: RegExp;
}

export interface IPrefixMap {
  [key: number]: string;
}

export class FrameBlob extends FrameAtom {
  public static readonly BLOB_START = "0";
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

  public static fix_source(source: string) {
    if (source === "") {
      return "0" + FrameBlob.BLOB_PREFIX[16] + "0";
    }
    if (source[0] !== "0") {
      return "0" + source;
    }
    return source;
  }

  public static find_base(source: string) {
    const prefix = source.substr(1, 1);
    const keys = Object.keys(FrameBlob.BLOB_PREFIX);
    const base = keys.find((k) => FrameBlob.BLOB_PREFIX[parseInt(k, 10)] === prefix);
    return parseInt(base, 10);
  }

  public static count_bits(digits: string, base: number) {
    const length = digits.length;
    const entropy = Math.log2(base);
    const bits = length * entropy;
    return BigInt(bits);
  }

  public static leading_zeros(digits: string) {
    const match = /^0*/.exec(digits);
    const head = match[0];
    return head;
  }

  protected data: bigint;
  protected base: number;
  protected n_bits: bigint;
  protected is_zero: boolean;
  protected zeros: string;

  constructor(source: string) {
    super(NilContext);
    source = FrameBlob.fix_source(source);
    const digits = source.substr(2);

    this.data = BigInt(source);
    this.base = FrameBlob.find_base(source);
    this.n_bits = FrameBlob.count_bits(digits, this.base);
    this.zeros = FrameBlob.leading_zeros(digits);
    this.is_zero = (this.zeros.length === digits.length);
  }

  public called_by(context: Frame, parameter: Frame): Frame {
    if (context instanceof FrameBlob) {
      const left_operand = context as FrameBlob;
      const result = left_operand.append(this);
      return result;
    }
    return super.called_by(context, parameter);
  }

  public string_start() {
    return FrameBlob.BLOB_START;
  };

  public string_prefix() {
    const sigil = FrameBlob.BLOB_PREFIX[this.base];
    let zeros = this.zeros;
    if (this.is_zero) {
      zeros = zeros.substr(1);
    }
    return "0" + sigil + zeros;
  };

  public canInclude(char: string) {
    const regex = FrameBlob.BLOB_DIGITS[64]; // accept everything, to start
    return regex.test(char);
  }

  public toString(): string {
    return this.string_prefix() + this.toData().toString(this.base) + this.string_suffix();
  }

  protected toData() { return this.data; }

  protected append(right_operand: FrameBlob) {
    const left = right_operand.exalt(this);
    // if (this.data.toString() === "0n") { this.zeros = this.zeros + "0"; }
    this.data = left + right_operand.data;
    this.n_bits = this.n_bits + right_operand.n_bits;
    return this;
  };

  protected exalt(left_operand: FrameBlob) {
    const result = left_operand.shift_left(this.n_bits);
    return result;
  };

  protected shift_left(n_bits: bigint) {
    const bigint_result = this.data << n_bits;
    return bigint_result;
  };
};
