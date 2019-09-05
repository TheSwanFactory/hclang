import * as _ from "lodash";
import { FrameAtom } from "./frame-atom";
import { Context, NilContext } from "./meta-frame";

export interface IRegexpMap {
    [key: number]: RegExp;
}

export class FrameBlob extends FrameAtom {
  public static readonly BLOB_START = "0";
  public static readonly BLOB_DIGITS: IRegexpMap = {
    "2": /[01]/,
    "8": /[0-7]/,
    "10": /[0-9]/,
    "16": /[0-9a-f]/,
    "32": /[0-9a-hj-np-z]/,
    "64": /[0-9a-zA-Z+/=]/,
  };
  public static readonly BLOB_KEY = {
    "2": "b", // 1
    "8": "o", // 3
    "10": "d", // N/A
    "16": "x", // 4
    "32": "t", // 5
    "64": "s", // 6
  };

  public static bytes_per_char(base: number)  {
    const bits_per_byte = 8;
    const bits_per_char = Math.log2(base);
    const bytes_per_char = bits_per_char / bits_per_byte;
    return bytes_per_char;
  }

  public static parse(digits: string, base: number)  {
    const UINT_MAX_BYTES = 4;
    const bytes_per_char = FrameBlob.bytes_per_char(base);
    const n_char = digits.length;
    const max_char = UINT_MAX_BYTES / bytes_per_char;
    const excess = n_char - max_char;
    if (excess > 0) {
      console.error("FrameBlob.parse.overflow.Uint32.base." + base, digits);
      digits = digits.substr(excess);
    }
    const number = parseInt(digits, base);
    return new Uint32Array([number]);
  }

  protected static numbers: { [key: string]: FrameBlob; } = {};
  protected data: ArrayBuffer;

  constructor(source: string, protected base: number) {
    super(NilContext);
    this.data = FrameBlob.parse(source, base);
  }

  public string_start() {
    return FrameBlob.BLOB_START;
  };

  public canInclude(char: string) {
    const regex = FrameBlob.BLOB_DIGITS[this.base];
    return regex.test(char);
  }

  protected toData() { return this.data; }
};
