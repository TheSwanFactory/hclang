import { FrameAtom } from "./frame-atom.ts";
import { Frame } from "./frame.ts";

export type NumericRank = 0 | 1 | 2 | 3;

type ArithmeticOperator = "+" | "-" | "*" | "/" | "%%" | "**";
type OrderingOperator = "<" | "<=" | ">" | ">=";
type Comparison = -1 | 0 | 1 | null;

/** The largest count accepted by integer repetition. */
export const REPETITION_LIMIT = 65_536n;

/** Maximum estimated bit width of an exact power result. */
export const EXACT_POWER_BIT_LIMIT = 1_000_000n;

/** Whether bigint exponentiation can stay within the exact-result budget. */
export function exactPowerWithinLimit(
  values: readonly bigint[],
  exponent: bigint,
): boolean {
  const positiveExponent = exponent < 0n ? -exponent : exponent;
  return values.every((value) => {
    const magnitude = value < 0n ? -value : value;
    if (positiveExponent === 0n || magnitude <= 1n) return true;
    const bits = BigInt(magnitude.toString(2).length);
    const resultBits = (magnitude & (magnitude - 1n)) === 0n
      ? (bits - 1n) * positiveExponent + 1n
      : bits * positiveExponent;
    return resultBits <= EXACT_POWER_BIT_LIMIT;
  });
}

/** Bigint power with constant-time handling for values independent of size. */
export function exactBigIntPower(base: bigint, exponent: bigint): bigint {
  if (exponent === 0n) return 1n;
  if (base === 0n || base === 1n) return base;
  if (base === -1n) return exponent % 2n === 0n ? 1n : -1n;
  return base ** exponent;
}

/**
 * Projects a bigint ratio without first converting two huge values to
 * Infinity. The significant-prefix fallback preserves finite host ratios when
 * either individual integer is outside Number's range.
 */
export function projectBigIntRatio(
  numerator: bigint,
  denominator: bigint,
): number {
  if (numerator === 0n) return 0;

  const directNumerator = Number(numerator);
  const directDenominator = Number(denominator);
  if (
    Number.isFinite(directNumerator) && Number.isFinite(directDenominator)
  ) {
    return directNumerator / directDenominator;
  }

  const sign = numerator < 0n ? -1 : 1;
  const numeratorDigits = (numerator < 0n ? -numerator : numerator).toString();
  const denominatorDigits = denominator.toString();
  const significantDigits = 16;
  const numeratorHead = numeratorDigits.slice(0, significantDigits);
  const denominatorHead = denominatorDigits.slice(0, significantDigits);
  const numeratorSignificand = Number(numeratorHead) /
    10 ** (numeratorHead.length - 1);
  const denominatorSignificand = Number(denominatorHead) /
    10 ** (denominatorHead.length - 1);
  let significand = numeratorSignificand / denominatorSignificand;
  let exponent = numeratorDigits.length - denominatorDigits.length;

  if (significand >= 10) {
    significand /= 10;
    exponent += 1;
  } else if (significand < 1) {
    significand *= 10;
    exponent -= 1;
  }

  return sign * Number(`${significand}e${exponent}`);
}

/** Shared rank-based numeric dispatch and unary/apply behavior. */
export abstract class FrameNumeric extends FrameAtom {
  public abstract readonly rank: NumericRank | null;

  public add(right: FrameNumeric): Frame {
    return this.join(
      right,
      "+",
      (left, joinedRight) => left.addSame(joinedRight),
    );
  }

  public subtract(right: FrameNumeric): Frame {
    return this.join(
      right,
      "-",
      (left, joinedRight) => left.subtractSame(joinedRight),
    );
  }

  public multiply(right: FrameNumeric): Frame {
    return this.join(
      right,
      "*",
      (left, joinedRight) => left.multiplySame(joinedRight),
    );
  }

  public divide(right: FrameNumeric): Frame {
    if (this.rank == null || right.rank == null) {
      return this.operationError("/", right);
    }
    if (right.isZero()) return Frame.error("$!.division-by-zero /");

    const target: NumericRank = this.rank === 3 || right.rank === 1 ||
        right.rank === 3
      ? 3
      : 2;
    if (target === 3 && this.rank !== 3 && right.rank !== 3) {
      const projectedLeft = this.promoteTo(3);
      const projectedRight = right.promoteTo(3);
      const leftValue = Number(projectedLeft.valueOf());
      const rightValue = Number(projectedRight.valueOf());
      if (
        Number.isFinite(leftValue) && Number.isFinite(rightValue) &&
        rightValue !== 0
      ) {
        return projectedLeft.divideSame(projectedRight);
      }

      const leftRatio = this.ratioParts();
      const rightRatio = right.ratioParts();
      if (leftRatio && rightRatio) {
        const [leftNumerator, leftDenominator] = leftRatio;
        const [rightNumerator, rightDenominator] = rightRatio;
        return this.inexactResult(
          projectBigIntRatio(
            leftNumerator * rightDenominator,
            leftDenominator * rightNumerator,
          ),
        );
      }
    }
    return this.promoteTo(target).divideSame(right.promoteTo(target));
  }

  public modulo(right: FrameNumeric): Frame {
    if (this.rank !== 0 || right.rank !== 0) {
      return this.operationError("%%", right);
    }
    if (right.isZero()) return Frame.error("$!.modulo-by-zero %%");
    return this.moduloSame(right);
  }

  public power(right: FrameNumeric): Frame {
    if (this.rank == null || right.rank == null) {
      return this.operationError("**", right);
    }

    const exponent = right.integralValue();
    if (exponent == null) {
      const leftNumber = this.promoteTo(3);
      const rightNumber = right.promoteTo(3);
      return leftNumber.powerSame(rightNumber);
    }
    if (exponent < 0n && this.isZero()) {
      return Frame.error("$!.division-by-zero **");
    }
    if (exponent < 0n && this.rank !== 3) {
      return this.promoteTo(2).powerIntegral(exponent);
    }
    return this.powerIntegral(exponent);
  }

  public lessThan(right: FrameNumeric): Frame {
    return this.order(right, "<", (comparison) => comparison < 0);
  }

  public lessThanOrEqual(right: FrameNumeric): Frame {
    return this.order(right, "<=", (comparison) => comparison <= 0);
  }

  public greaterThan(right: FrameNumeric): Frame {
    return this.order(right, ">", (comparison) => comparison > 0);
  }

  public greaterThanOrEqual(right: FrameNumeric): Frame {
    return this.order(right, ">=", (comparison) => comparison >= 0);
  }

  public override equals(right: Frame): Frame {
    if (!(right instanceof FrameNumeric)) return Frame.nil;
    if (this.rank == null || right.rank == null) return Frame.nil;
    const target = Math.max(this.rank, right.rank) as NumericRank;
    return this.promoteTo(target).compareSame(right.promoteTo(target)) === 0
      ? Frame.all
      : Frame.nil;
  }

  public override apply(argument: Frame, parameter: Frame): Frame {
    return argument instanceof FrameNumeric
      ? this.multiply(argument)
      : this.repeat(argument, parameter);
  }

  public override called_by(context: Frame, parameter: Frame): Frame {
    if ("operator" in context && context.operator === "+") {
      return this.unaryPlus();
    }
    if ("operator" in context && context.operator === "-") {
      return this.unaryMinus();
    }
    return super.called_by(context, parameter);
  }

  /** The exact integer denoted by this frame, or a stable domain/range error. */
  public exactInt(_max?: bigint): bigint | Frame {
    return Frame.error(`$!.exact-integer-required ${this.className()}`);
  }

  public abstract isZero(): boolean;

  protected abstract promoteOne(): FrameNumeric;
  protected abstract ratioParts(): readonly [bigint, bigint] | null;
  protected abstract inexactResult(value: number): Frame;
  protected abstract integralValue(): bigint | null;
  protected abstract unaryPlus(): Frame;
  protected abstract unaryMinus(): Frame;
  protected abstract addSame(right: FrameNumeric): Frame;
  protected abstract subtractSame(right: FrameNumeric): Frame;
  protected abstract multiplySame(right: FrameNumeric): Frame;
  protected abstract divideSame(right: FrameNumeric): Frame;
  protected abstract moduloSame(right: FrameNumeric): Frame;
  protected abstract powerSame(right: FrameNumeric): Frame;
  protected abstract powerIntegral(exponent: bigint): Frame;
  protected abstract compareSame(right: FrameNumeric): Comparison;

  protected operationError(
    operator: ArithmeticOperator | OrderingOperator,
    right: FrameNumeric,
  ): Frame {
    return Frame.error(
      `$!.numeric-domain ${operator} ${this.className()} ${right.className()}`,
    );
  }

  protected repetitionError(): Frame {
    return Frame.error(`$!.repetition-domain ${this.className()}`);
  }

  protected repeat(_argument: Frame, _parameter: Frame): Frame {
    return this.repetitionError();
  }

  private promoteTo(target: NumericRank): FrameNumeric {
    if (this.rank == null || this.rank >= target) return this;

    const promoted = this.promoteOne();
    if (promoted.rank == null || promoted.rank <= this.rank) return this;
    return promoted.promoteTo(target);
  }

  private join(
    right: FrameNumeric,
    operator: "+" | "-" | "*",
    operation: (left: FrameNumeric, joinedRight: FrameNumeric) => Frame,
  ): Frame {
    if (this.rank == null || right.rank == null) {
      return this.operationError(operator, right);
    }
    const target = Math.max(this.rank, right.rank) as NumericRank;
    return operation(this.promoteTo(target), right.promoteTo(target));
  }

  private order(
    right: FrameNumeric,
    operator: OrderingOperator,
    predicate: (comparison: Exclude<Comparison, null>) => boolean,
  ): Frame {
    if (this.rank == null || right.rank == null) {
      return this.operationError(operator, right);
    }
    const target = Math.max(this.rank, right.rank) as NumericRank;
    const comparison = this.promoteTo(target).compareSame(
      right.promoteTo(target),
    );
    return comparison != null && predicate(comparison) ? Frame.all : Frame.nil;
  }
}
