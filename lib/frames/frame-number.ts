import { type Context, NilContext } from "./context.ts";
import { Frame } from "./frame.ts";
import { FrameNumeric, type NumericRank } from "./frame-numeric.ts";

/** Inexact host-number rung, reached only by projection or inexact arithmetic. */
export class FrameNumber extends FrameNumeric {
  private static readonly numbers: Record<string, FrameNumber> = {};

  public static for(value: string | number): FrameNumber {
    const key = Number(value).toString();
    return FrameNumber.numbers[key] ??= new FrameNumber(value);
  }

  /** Preserves the spelling of legacy host numeric strings that are inexact. */
  public static fromHost(value: string): FrameNumber {
    return new FrameNumber(value, NilContext, value);
  }

  public readonly rank: NumericRank = 3;
  public readonly data: number;
  public readonly spelling: string;

  public constructor(
    value: string | number,
    meta: Context = NilContext,
    spelling?: string,
  ) {
    super(meta);
    this.data = Number(value);
    this.spelling = spelling ?? this.data.toString();
  }

  public override valueOf(): number {
    return this.data;
  }

  public override isZero(): boolean {
    return this.data === 0;
  }

  protected override toData(): string {
    return this.spelling;
  }

  protected override promoteOne(): FrameNumeric {
    return this;
  }

  protected override ratioParts(): null {
    return null;
  }

  protected override inexactResult(value: number): Frame {
    return new FrameNumber(value);
  }

  protected override integralValue(): bigint | null {
    return Number.isFinite(this.data) && Number.isInteger(this.data)
      ? BigInt(this.data)
      : null;
  }

  protected override unaryPlus(): Frame {
    if (this.spelling.startsWith("+") || this.spelling.startsWith("-")) {
      return this;
    }
    return new FrameNumber(this.data, NilContext, `+${this.spelling}`);
  }

  protected override unaryMinus(): Frame {
    return new FrameNumber(-this.data);
  }

  protected override addSame(right: FrameNumeric): Frame {
    return new FrameNumber(this.data + (right as FrameNumber).data);
  }

  protected override subtractSame(right: FrameNumeric): Frame {
    return new FrameNumber(this.data - (right as FrameNumber).data);
  }

  protected override multiplySame(right: FrameNumeric): Frame {
    return new FrameNumber(this.data * (right as FrameNumber).data);
  }

  protected override divideSame(right: FrameNumeric): Frame {
    return new FrameNumber(this.data / (right as FrameNumber).data);
  }

  protected override moduloSame(right: FrameNumeric): Frame {
    return this.operationError("%%", right);
  }

  protected override powerSame(right: FrameNumeric): Frame {
    return new FrameNumber(this.data ** (right as FrameNumber).data);
  }

  protected override powerIntegral(exponent: bigint): Frame {
    return new FrameNumber(this.data ** Number(exponent));
  }

  protected override compareSame(right: FrameNumeric): -1 | 0 | 1 | null {
    const value = (right as FrameNumber).data;
    if (Number.isNaN(this.data) || Number.isNaN(value)) return null;
    return this.data < value ? -1 : this.data > value ? 1 : 0;
  }
}
