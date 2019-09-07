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

  protected static numbers: { [key: string]: FrameBlob; } = {};
  protected data: bigint;
  protected length: number;

  constructor(source: string, protected base: number) {
    super(NilContext);
    this.data = BigInt(source);
    this.length = source.length;
  }

  public called_by(context: Frame, parameter: Frame): Frame {
    if (context instanceof FrameBlob) {
      const left_operand = context as FrameBlob;
      return this.exalt(left_operand);
    }
    return super.called_by(context, parameter);
  }

  public string_start() {
    return FrameBlob.BLOB_START;
  };

  public string_prefix() {
    const sigil = FrameBlob.BLOB_PREFIX[this.base];
     return "0" + sigil;
   };

  public canInclude(char: string) {
    const regex = FrameBlob.BLOB_DIGITS[this.base];
    return regex.test(char);
  }

  public toString(): string {
    return this.string_prefix() + this.toData().toString(this.base) + this.string_suffix();
  }

  protected toData() { return this.data; }

  protected shift_left(base: number, length: number) {
    const shift = BigInt(base * length);
    this.data = this.data << shift;
    return this;
  };

  protected exalt(left_operand: FrameBlob) {
    left_operand.shift_left(this.base, this.length);
    return left_operand;
  };
};
