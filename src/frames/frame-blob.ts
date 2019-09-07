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
    16: /[0-9a-f]/,
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

  public static leading_zeros(source: string) {
    const digits = source.substr(2);
    const match = /^0*/.exec(digits);
    const head = match[0];
    return head;
  }

  public static find_base(source: string) {
    const prefix = source.substr(1, 1);
    const keys = Object.keys(FrameBlob.BLOB_PREFIX);
    const base = keys.find((k) => FrameBlob.BLOB_PREFIX[parseInt(k, 10)] === prefix);
    return parseInt(base, 10);
  }

  protected data: bigint;
  protected n_bits: bigint;
  protected zeros: string;

  constructor(source: string, protected base: number) {
    super(NilContext);
    const length = source.length - 2;
    const entropy = Math.log2(base);
    const bits = length * entropy;
    this.n_bits = BigInt(bits);
    this.data = BigInt(source);
    this.zeros = FrameBlob.leading_zeros(source);
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
     return "0" + sigil + this.zeros;
   };

  public canInclude(char: string) {
    const regex = FrameBlob.BLOB_DIGITS[this.base];
    return regex.test(char);
  }

  public toString(): string {
    return this.string_prefix() + this.toData().toString(this.base) + this.string_suffix();
  }

  protected toData() { return this.data; }

  protected append(right_operand: FrameBlob) {
    const left = right_operand.exalt(this);
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
