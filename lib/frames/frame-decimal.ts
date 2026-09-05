import { type Context, NilContext } from "./context.ts";
import { Frame } from "./frame.ts";
import {
  EXACT_POWER_BIT_LIMIT,
  exactBigIntPower,
  exactPowerWithinLimit,
  FrameNumeric,
  type NumericRank,
  projectBigIntRatio,
} from "./frame-numeric.ts";
import { FrameNumber } from "./frame-number.ts";
import { FrameRational } from "./frame-rational.ts";
import { FrameSequence } from "./frame-sequence.ts";
import type { MetaFrame } from "./meta-frame.ts";

const DECIMAL_SOURCE = /^([+-]?)(\d+)(?:\.(\d+))?$/;

function powerOfTen(scale: number): bigint {
  return 10n ** BigInt(scale);
}

function renderDecimal(numerator: bigint, scale: number): string {
  const negative = numerator < 0n;
  let digits = (negative ? -numerator : numerator).toString();
  if (scale > 0) {
    digits = digits.padStart(scale + 1, "0");
    const split = digits.length - scale;
    digits = `${digits.slice(0, split)}.${digits.slice(split)}`;
  }
  return `${negative ? "-" : ""}${digits}`;
}

/** Exact scaled-bigint decimal produced by one numeric property lookup. */
export class FrameDecimal extends FrameNumeric {
  public static fromParts(numerator: bigint, scale: number): FrameDecimal {
    return new FrameDecimal(renderDecimal(numerator, scale));
  }

  public readonly rank: NumericRank = 1;
  public readonly numerator: bigint;
  public readonly scale: number;
  public readonly spelling: string;

  public constructor(source: string, meta: Context = NilContext) {
    super(meta);
    const match = DECIMAL_SOURCE.exec(source);
    if (!match) throw new TypeError(`invalid decimal source: ${source}`);

    const sign = match[1] === "-" ? -1n : 1n;
    const fraction = match[3] ?? "";
    this.scale = fraction.length;
    this.numerator = sign * BigInt(`${match[2]}${fraction}`);
    this.spelling = source;
  }

  protected override lookup_here(key: string, origin: MetaFrame): Frame {
    if (/^\d+$/.test(key)) {
      return this.spelling.startsWith("-")
        ? Frame.error("$!.numeric-domain unary- FrameSequence")
        : new FrameSequence(`${this.spelling}.${key}`);
    }
    return super.lookup_here(key, origin);
  }

  public override exactInt(max?: bigint): bigint | Frame {
    if (this.scale !== 0) {
      return Frame.error(`$!.exact-integer-required ${this.className()}`);
    }
    return max != null && this.numerator > max
      ? Frame.error(`$!.integer-range ${this.spelling} ${max}`)
      : this.numerator;
  }

  public override valueOf(): number {
    return projectBigIntRatio(this.numerator, powerOfTen(this.scale));
  }

  public override isZero(): boolean {
    return this.numerator === 0n;
  }

  protected override toData(): string {
    return this.spelling;
  }

  protected override promoteOne(): FrameNumeric {
    return new FrameRational(this.numerator, powerOfTen(this.scale));
  }

  protected override ratioParts(): readonly [bigint, bigint] {
    return [this.numerator, powerOfTen(this.scale)];
  }

  protected override inexactResult(value: number): Frame {
    return new FrameNumber(value);
  }

  protected override integralValue(): bigint | null {
    const denominator = powerOfTen(this.scale);
    return this.numerator % denominator === 0n
      ? this.numerator / denominator
      : null;
  }

  protected override unaryPlus(): Frame {
    if (this.spelling.startsWith("+") || this.spelling.startsWith("-")) {
      return this;
    }
    return new FrameDecimal(`+${this.spelling}`);
  }

  protected override unaryMinus(): Frame {
    const unsigned = this.spelling.replace(/^[+-]/, "");
    const spelling = this.spelling.startsWith("-") ? unsigned : `-${unsigned}`;
    return new FrameDecimal(spelling);
  }

  protected override addSame(right: FrameNumeric): Frame {
    const decimal = right as FrameDecimal;
    const scale = Math.max(this.scale, decimal.scale);
    const leftNumerator = this.numerator * powerOfTen(scale - this.scale);
    const rightNumerator = decimal.numerator * powerOfTen(
      scale - decimal.scale,
    );
    return FrameDecimal.fromParts(leftNumerator + rightNumerator, scale);
  }

  protected override subtractSame(right: FrameNumeric): Frame {
    const decimal = right as FrameDecimal;
    const scale = Math.max(this.scale, decimal.scale);
    const leftNumerator = this.numerator * powerOfTen(scale - this.scale);
    const rightNumerator = decimal.numerator * powerOfTen(
      scale - decimal.scale,
    );
    return FrameDecimal.fromParts(leftNumerator - rightNumerator, scale);
  }

  protected override multiplySame(right: FrameNumeric): Frame {
    const decimal = right as FrameDecimal;
    return FrameDecimal.fromParts(
      this.numerator * decimal.numerator,
      this.scale + decimal.scale,
    );
  }

  protected override divideSame(_right: FrameNumeric): Frame {
    return Frame.error("$!.numeric-internal / FrameDecimal");
  }

  protected override moduloSame(right: FrameNumeric): Frame {
    return this.operationError("%%", right);
  }

  protected override powerSame(right: FrameNumeric): Frame {
    const exponent = (right as FrameDecimal).integralValue();
    return exponent == null
      ? Frame.error("$!.numeric-internal ** FrameDecimal")
      : this.powerIntegral(exponent);
  }

  protected override powerIntegral(exponent: bigint): Frame {
    if (exponent < 0n) {
      return Frame.error("$!.numeric-internal ** FrameDecimal");
    }
    const resultScale = BigInt(this.scale) * exponent;
    if (
      resultScale > EXACT_POWER_BIT_LIMIT ||
      !exactPowerWithinLimit([this.numerator], exponent)
    ) {
      return Frame.error("$!.numeric-range ** FrameDecimal");
    }
    return FrameDecimal.fromParts(
      exactBigIntPower(this.numerator, exponent),
      Number(resultScale),
    );
  }

  protected override compareSame(right: FrameNumeric): -1 | 0 | 1 {
    const decimal = right as FrameDecimal;
    const scale = Math.max(this.scale, decimal.scale);
    const leftNumerator = this.numerator * powerOfTen(scale - this.scale);
    const rightNumerator = decimal.numerator * powerOfTen(
      scale - decimal.scale,
    );
    return leftNumerator < rightNumerator
      ? -1
      : leftNumerator > rightNumerator
      ? 1
      : 0;
  }
}
