import { type Context, NilContext } from "./context.ts";
import { Frame } from "./frame.ts";
import { FrameNumeric, type NumericRank } from "./frame-numeric.ts";
import type { FrameDecimal } from "./frame-decimal.ts";

const UNIT_SOURCE = /^[A-Za-z]+$/;

/** Inert exact magnitude carrying an opaque unit spelling. */
export class FrameTypedNumber extends FrameNumeric {
  public readonly rank: NumericRank | null = null;
  public readonly magnitude: FrameDecimal;
  public readonly unit: string;
  public readonly spelling: string;

  public constructor(
    magnitude: FrameDecimal,
    unit: string,
    meta: Context = NilContext,
  ) {
    super(meta);
    if (!UNIT_SOURCE.test(unit)) {
      throw new TypeError(`invalid unit segment: ${unit}`);
    }
    this.magnitude = magnitude;
    this.unit = unit;
    this.spelling = `${magnitude.spelling}.${unit}`;
  }

  public override equals(right: Frame): Frame {
    if (
      !(right instanceof FrameTypedNumber) || this.unit !== right.unit
    ) {
      return Frame.nil;
    }
    return this.magnitude.equals(right.magnitude) === Frame.all
      ? Frame.all
      : Frame.nil;
  }

  public override isZero(): boolean {
    return this.magnitude.isZero();
  }

  public override valueOf(): Frame {
    return Frame.error("$!.numeric-domain projection FrameTypedNumber");
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

  protected override inexactResult(_value: number): Frame {
    return Frame.error("$!.numeric-domain projection FrameTypedNumber");
  }

  protected override integralValue(): null {
    return null;
  }

  protected override unaryPlus(): Frame {
    return this;
  }

  protected override unaryMinus(): Frame {
    return Frame.error("$!.numeric-domain unary- FrameTypedNumber");
  }

  protected override addSame(right: FrameNumeric): Frame {
    return this.operationError("+", right);
  }

  protected override subtractSame(right: FrameNumeric): Frame {
    return this.operationError("-", right);
  }

  protected override multiplySame(right: FrameNumeric): Frame {
    return this.operationError("*", right);
  }

  protected override divideSame(right: FrameNumeric): Frame {
    return this.operationError("/", right);
  }

  protected override moduloSame(right: FrameNumeric): Frame {
    return this.operationError("%%", right);
  }

  protected override powerSame(right: FrameNumeric): Frame {
    return this.operationError("**", right);
  }

  protected override powerIntegral(_exponent: bigint): Frame {
    return Frame.error(
      "$!.numeric-domain ** FrameTypedNumber FrameTypedNumber",
    );
  }

  protected override compareSame(_right: FrameNumeric): null {
    return null;
  }
}
