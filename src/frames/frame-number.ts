import { Frame } from "./frame.ts";
import { FrameAtom } from "./frame-atom.ts";
import { Context, NilContext } from "./meta-frame.ts";

export class FrameNumber extends FrameAtom {
  public static readonly NUMBER_BEGIN = /[1-9]/;
  public static readonly NUMBER_CHAR = /\d/;

  public static for(digits: string) {
    const exists = FrameNumber.numbers[digits];
    return exists || (FrameNumber.numbers[digits] = new FrameNumber(digits));
  }

  protected static numbers: { [key: string]: FrameNumber } = {};
  protected data: number;

  constructor(source: string, meta: Context = NilContext) {
    super(meta);
    this.data = parseInt(source, 10);
  }

  public override apply(argument: Frame, _parameter: Frame): Frame {
    // repeatedly apply argument `this.data` times
    let result = Frame.nil;
    if ((argument instanceof FrameNumber)) {
      const value = this.data * argument.data;
      result = new FrameNumber(value.toString());
    } else {
      this.range().forEach(() => {
        result = result.apply(argument, _parameter);
      });
    }
    return result;
  }

  public range(): Array<number> {
    return [...Array(this.data).keys()];
  }

  public override string_start() {
    return FrameNumber.NUMBER_BEGIN.toString();
  }

  public override canInclude(char: string) {
    return FrameNumber.NUMBER_CHAR.test(char);
  }

  protected override toData() {
    return this.data;
  }

  /*
   * Math Operations
   */

  public add(right: FrameNumber) {
    const value = this.data + right.data;
    return new FrameNumber(value.toString());
  }

  public subtract(right: FrameNumber) {
    const value = this.data - right.data;
    return new FrameNumber(value.toString());
  }

  public multiply(right: FrameNumber) {
    const value = this.data * right.data;
    return new FrameNumber(value.toString());
  }

  public divide(right: FrameNumber) {
    const value = this.data / right.data;
    return new FrameNumber(value.toString());
  }

  public modulo(right: FrameNumber) {
    const value = this.data % right.data;
    return new FrameNumber(value.toString());
  }

  public power(right: FrameNumber) {
    const value = this.data ** right.data;
    return new FrameNumber(value.toString());
  }

  public equals(right: FrameNumber) {
    return this.data === right.data ? Frame.all : Frame.nil;
  }

  public lessThan(right: FrameNumber) {
    return this.data < right.data ? Frame.all : Frame.nil;
  }

  public greaterThan(right: FrameNumber) {
    return this.data > right.data ? Frame.all : Frame.nil;
  }

  public lessThanOrEqual(right: FrameNumber) {
    return this.data <= right.data ? Frame.all : Frame.nil;
  }

  public greaterThanOrEqual(right: FrameNumber) {
    return this.data >= right.data ? Frame.all : Frame.nil;
  }
}
