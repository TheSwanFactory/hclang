import { Frame } from "./frame.ts";
import { FrameAtom } from "./frame-atom.ts";
import { NilContext } from "./context.ts";
import type { Context } from "./context.ts";
import type { MetaFrame } from "./meta-frame.ts";
import type { SigilStart } from "../scan.ts";
export class FrameNumber extends FrameAtom {
  public static readonly NUMBER_BEGIN = /[1-9]/;
  public static readonly NUMBER_CHAR = /\d/;
  public static readonly SIGIL_STARTS = [
    { key: FrameNumber.NUMBER_BEGIN.toString(), mode: "atom" },
  ] as const satisfies readonly SigilStart[];

  public static for(digits: string): FrameNumber {
    const exists = FrameNumber.numbers[digits];
    return exists || (FrameNumber.numbers[digits] = new FrameNumber(digits));
  }

  protected static numbers: { [key: string]: FrameNumber } = {};
  protected data: number;
  protected spelling: string;

  constructor(source: string, meta: Context = NilContext) {
    super(meta);
    this.data = Number(source);
    this.spelling = source;
  }

  public override get(key: string, origin: MetaFrame = this): Frame {
    if (/^\d+$/.test(key)) {
      return new FrameNumber(`${this.spelling}.${key}`);
    }
    return super.get(key, origin);
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

  public override called_by(context: Frame, parameter: Frame): Frame {
    if ("operator" in context && context.operator === "+") {
      return new FrameNumber(`+${this.spelling}`);
    }
    return super.called_by(context, parameter);
  }

  public range(): Array<number> {
    return [...Array(this.data).keys()];
  }

  public override string_start(): string {
    return FrameNumber.NUMBER_BEGIN.toString();
  }

  public override canInclude(char: string): boolean {
    return FrameNumber.NUMBER_CHAR.test(char);
  }

  protected override toData(): string {
    return this.spelling;
  }

  /*
   * Math Operations
   */

  public override valueOf(): number {
    return this.data;
  }

  public add(right: FrameNumber): FrameNumber {
    const value = this.data + right.data;
    return new FrameNumber(value.toString());
  }

  public subtract(right: FrameNumber): FrameNumber {
    const value = this.data - right.data;
    return new FrameNumber(value.toString());
  }

  public multiply(right: FrameNumber): FrameNumber {
    const value = this.data * right.data;
    return new FrameNumber(value.toString());
  }

  public divide(right: FrameNumber): FrameNumber {
    const value = this.data / right.data;
    return new FrameNumber(value.toString());
  }

  public modulo(right: FrameNumber): FrameNumber {
    const value = this.data % right.data;
    return new FrameNumber(value.toString());
  }

  public power(right: FrameNumber): FrameNumber {
    const value = this.data ** right.data;
    return new FrameNumber(value.toString());
  }

  public lessThan(right: FrameNumber): Frame {
    return this.data < right.data ? Frame.all : Frame.nil;
  }

  public greaterThan(right: FrameNumber): Frame {
    return this.data > right.data ? Frame.all : Frame.nil;
  }

  public override equals(right: FrameNumber): Frame {
    return this.data === right.data ? Frame.all : Frame.nil;
  }

  public lessThanOrEqual(right: FrameNumber): Frame {
    return this.data <= right.data ? Frame.all : Frame.nil;
  }

  public greaterThanOrEqual(right: FrameNumber): Frame {
    return this.data >= right.data ? Frame.all : Frame.nil;
  }
}
