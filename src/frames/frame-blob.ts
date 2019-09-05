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
    "2": "b",
    "8": "o",
    "10": "d",
    "16": "x",
    "32": "t",
    "64": "s",
  };

  public static parse(digits: string, base: number): ArrayBuffer {
    const number = parseInt(digits, base);
    const n = digits.length / base;
    return new ArrayBuffer(n);
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
