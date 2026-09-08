import { type Context, NilContext } from "./context.ts";
import { Frame } from "./frame.ts";
import { FrameNumeric, type NumericRank } from "./frame-numeric.ts";
import type { FrameDecimal } from "./frame-decimal.ts";
import type { MetaFrame } from "./meta-frame.ts";

/**
 * One unit segment: letters, then an optional integer exponent whose sign is
 * spelled with a hyphen. `m`, `m2`, and `s-1` qualify; `2s` and `s_1` do not.
 */
const UNIT_SEGMENT = /^[A-Za-z]+(?:-?\d+)?$/;

/** Inert exact magnitude carrying an opaque, dotted unit spelling. */
export class FrameTypedNumber extends FrameNumeric {
  /** Whether a property key spells a unit segment this frame would absorb. */
  public static isUnitSegment(key: string): boolean {
    return UNIT_SEGMENT.test(key);
  }

  public readonly rank: NumericRank | null = null;
  public readonly magnitude: FrameDecimal;
  public readonly unit: string;
  public readonly segments: readonly string[];
  public readonly spelling: string;

  public constructor(
    magnitude: FrameDecimal,
    unit: string,
    meta: Context = NilContext,
  ) {
    super(meta);
    const segments = unit.split(".");
    if (!segments.every(FrameTypedNumber.isUnitSegment)) {
      throw new TypeError(`invalid unit segment: ${unit}`);
    }
    this.magnitude = magnitude;
    this.unit = unit;
    this.segments = Object.freeze(segments);
    this.spelling = `${magnitude.spelling}.${unit}`;
  }

  /**
   * A further unit segment extends the unit rather than reporting a missing
   * name, so a composite such as `9.8.m.s-1` is written as it is read. The unit
   * stays an opaque spelling: no segment is reordered, and no exponent is
   * folded, so `9.8.m2` and `9.8.m.m` are different quantities, exactly as
   * `1000.0.m` and `1.0.km` already are.
   */
  protected override lookup_here(key: string, origin: MetaFrame): Frame {
    if (FrameTypedNumber.isUnitSegment(key)) {
      return new FrameTypedNumber(this.magnitude, `${this.unit}.${key}`);
    }
    return super.lookup_here(key, origin);
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
