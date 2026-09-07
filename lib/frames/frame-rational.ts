import { type Context, NilContext } from "./context.ts";
import { FrameInt } from "./frame-int.ts";
import { Frame } from "./frame.ts";
import {
  exactBigIntPower,
  exactPowerWithinLimit,
  FrameNumeric,
  type NumericRank,
  projectBigIntRatio,
} from "./frame-numeric.ts";
import { FrameNumber } from "./frame-number.ts";

function greatestCommonDivisor(left: bigint, right: bigint): bigint {
  let a = left < 0n ? -left : left;
  let b = right < 0n ? -right : right;
  while (b !== 0n) {
    [a, b] = [b, a % b];
  }
  return a;
}

/** Reduced exact ratio with a positive denominator. */
export class FrameRational extends FrameNumeric {
  public static create(numerator: bigint, denominator: bigint): Frame {
    if (denominator === 0n) return Frame.error("$!.division-by-zero /");
    const rational = new FrameRational(numerator, denominator);
    return rational.denominator === 1n
      ? new FrameInt(rational.numerator)
      : rational;
  }

  public readonly rank: NumericRank = 2;
  public readonly numerator: bigint;
  public readonly denominator: bigint;
  public readonly spelling: string;

  public constructor(
    numerator: bigint,
    denominator: bigint,
    meta: Context = NilContext,
    spelling?: string,
  ) {
    super(meta);
    if (denominator === 0n) {
      throw new RangeError("rational denominator must not be zero");
    }

    const sign = denominator < 0n ? -1n : 1n;
    const divisor = greatestCommonDivisor(numerator, denominator);
    this.numerator = sign * numerator / divisor;
    this.denominator = sign * denominator / divisor;
    this.spelling = spelling ?? `${this.numerator}/${this.denominator}`;
  }

  public override exactInt(max?: bigint): bigint | Frame {
    if (this.denominator !== 1n) {
      return Frame.error(`$!.exact-integer-required ${this.className()}`);
    }
    return max != null && this.numerator > max
      ? Frame.error(`$!.integer-range ${this.spelling} ${max}`)
      : this.numerator;
  }

  public override valueOf(): number {
    return projectBigIntRatio(this.numerator, this.denominator);
  }

  public override isZero(): boolean {
    return this.numerator === 0n;
  }

  protected override toData(): string {
    return this.spelling;
  }

  protected override promoteOne(): FrameNumeric {
    return new FrameNumber(this.valueOf());
  }

  protected override ratioParts(): readonly [bigint, bigint] {
    return [this.numerator, this.denominator];
  }

  protected override inexactResult(value: number): Frame {
    return new FrameNumber(value);
  }

  protected override integralValue(): bigint | null {
    return this.numerator % this.denominator === 0n
      ? this.numerator / this.denominator
      : null;
  }

  protected override unaryPlus(): Frame {
    if (this.spelling.startsWith("+") || this.spelling.startsWith("-")) {
      return this;
    }
    return new FrameRational(
      this.numerator,
      this.denominator,
      NilContext,
      `+${this.spelling}`,
    );
  }

  protected override unaryMinus(): Frame {
    const unsigned = this.spelling.replace(/^[+-]/, "");
    const spelling = this.spelling.startsWith("-") ? unsigned : `-${unsigned}`;
    return new FrameRational(
      -this.numerator,
      this.denominator,
      NilContext,
      spelling,
    );
  }

  protected override addSame(right: FrameNumeric): Frame {
    const rational = right as FrameRational;
    return FrameRational.create(
      this.numerator * rational.denominator +
        rational.numerator * this.denominator,
      this.denominator * rational.denominator,
    );
  }

  protected override subtractSame(right: FrameNumeric): Frame {
    const rational = right as FrameRational;
    return FrameRational.create(
      this.numerator * rational.denominator -
        rational.numerator * this.denominator,
      this.denominator * rational.denominator,
    );
  }

  protected override multiplySame(right: FrameNumeric): Frame {
    const rational = right as FrameRational;
    return FrameRational.create(
      this.numerator * rational.numerator,
      this.denominator * rational.denominator,
    );
  }

  protected override divideSame(right: FrameNumeric): Frame {
    const rational = right as FrameRational;
    return FrameRational.create(
      this.numerator * rational.denominator,
      this.denominator * rational.numerator,
    );
  }

  protected override moduloSame(right: FrameNumeric): Frame {
    return this.operationError("%%", right);
  }

  protected override powerSame(right: FrameNumeric): Frame {
    const exponent = (right as FrameRational).integralValue();
    return exponent == null
      ? Frame.error("$!.numeric-internal ** FrameRational")
      : this.powerIntegral(exponent);
  }

  protected override powerIntegral(exponent: bigint): Frame {
    const positive = exponent < 0n ? -exponent : exponent;
    if (
      !exactPowerWithinLimit(
        [this.numerator, this.denominator],
        positive,
      )
    ) {
      return Frame.error("$!.numeric-range ** FrameRational");
    }
    return exponent < 0n
      ? FrameRational.create(
        exactBigIntPower(this.denominator, positive),
        exactBigIntPower(this.numerator, positive),
      )
      : FrameRational.create(
        exactBigIntPower(this.numerator, positive),
        exactBigIntPower(this.denominator, positive),
      );
  }

  protected override compareSame(right: FrameNumeric): -1 | 0 | 1 {
    const rational = right as FrameRational;
    const leftProduct = this.numerator * rational.denominator;
    const rightProduct = rational.numerator * this.denominator;
    return leftProduct < rightProduct ? -1 : leftProduct > rightProduct ? 1 : 0;
  }
}
