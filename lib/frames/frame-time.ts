/**
 * The `%…%` family: an instant, or a duration.
 *
 * A time literal is inert data. Like `'…'`, it denotes without authorizing, and
 * parsing one performs no observation — which is what keeps the literal out of
 * the authority story entirely. Reading a clock is a separate thing, and it is a
 * harness grant rather than a literal.
 *
 * ## The `%…%` versus `%%` ruling
 *
 * `%…%` is a single-delimiter atom, so `%%` keeps its existing meaning as Modulo
 * and there is no empty time literal. a03 settled `"` against `"""` with
 * run-length parity, but the cases are not analogous: the doubled quote was an
 * unused spelling, while `%%` is an operator with behavior and an acceptance
 * corpus. The parity rule would have bought an empty instant — a value with no
 * meaning, since a time literal has to name an instant or a displacement — at
 * the price of an operator that works. So the family recognizes `%%` and hands
 * back the operator, which is where the collision is decided rather than
 * silently lost in the lexer table.
 *
 * ## What a literal may say
 *
 * An instant is offset-bearing: `%2026-08-21T00:00:00Z%` or an explicit `±hh:mm`.
 * A date alone is the start of that UTC day, because a day boundary has to be
 * pinned somewhere and UTC is the only choice that is not ambient. A time of day
 * with no offset is the civil-time case, which cannot become an instant without
 * tzdata — externally mutable data revised by political decision — so it is
 * refused here and named-zone conversion is a handler's business.
 *
 * A duration is fixed-length: weeks, days, hours, minutes, and seconds. `P1Y`
 * and `P1M` are refused, because a year and a month are calendar quantities
 * rather than displacements, and admitting them would put calendar rules in the
 * trusted base.
 *
 * ## The algebra
 *
 * Enforced, and enforced from a table rather than from branches: an instant is a
 * point, a duration is an interval, and every combination is looked up in
 * `dimensional-algebra.ts`, which the units work is meant to share rather than
 * reimplement. A combination the table does not name answers a type error.
 *
 * Arithmetic is exact. Values are nanoseconds in a bigint, so scaling by an
 * exact ratio is exact or refused, and no result is ever rounded into place.
 *
 * @module
 */
import { TIME_DELIMITER, unterminatedAtEnd } from "./atom-syntax.ts";
import { type Context, NilContext } from "./context.ts";
import {
  type DimensionalKind,
  type DimensionalOperator,
  dimensionalResult,
} from "./dimensional-algebra.ts";
import { Frame } from "./frame.ts";
import { FrameNumeric, type NumericRank } from "./frame-numeric.ts";
import { FrameRational } from "./frame-rational.ts";
import { FrameOperator } from "./frame-symbol.ts";
import {
  type AtomSyntax,
  ScanDisposition,
  type ScanResult,
  type SigilStart,
} from "../scan.ts";

/** Nanoseconds per second, and the units above it. */
const NANOS_PER_SECOND = 1_000_000_000n;
const NANOS_PER_MINUTE = 60n * NANOS_PER_SECOND;
const NANOS_PER_HOUR = 60n * NANOS_PER_MINUTE;
const NANOS_PER_DAY = 24n * NANOS_PER_HOUR;
const NANOS_PER_WEEK = 7n * NANOS_PER_DAY;

/** Milliseconds are what a host clock reports, so the factor is named once. */
export const NANOS_PER_MILLISECOND = 1_000_000n;

/** An offset-bearing instant, or a date standing for the start of its UTC day. */
const INSTANT =
  /^([+-]?\d{4,6})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{1,9}))?)?(Z|[+-]\d{2}(?::?\d{2})?)?)?$/;

/** A fixed-length ISO 8601 duration: weeks, days, and the time components. */
const DURATION =
  /^(-?)P(?:(\d+)W)?(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)(?:\.(\d{1,9}))?S)?)?$/;

/** A body opening like a duration, so a malformed one is not read as a date. */
const DURATION_START = /^-?P/;

/** Days in each month of a non-leap year. */
const MONTH_LENGTHS = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

const floorDiv = (value: bigint, divisor: bigint): bigint => {
  const quotient = value / divisor;
  const inexact = value % divisor !== 0n;
  return inexact && (value < 0n) !== (divisor < 0n) ? quotient - 1n : quotient;
};

const floorMod = (value: bigint, divisor: bigint): bigint =>
  value - floorDiv(value, divisor) * divisor;

const isLeapYear = (year: bigint): boolean =>
  year % 4n === 0n && (year % 100n !== 0n || year % 400n === 0n);

const daysInMonth = (year: bigint, month: number): number =>
  month === 2 && isLeapYear(year) ? 29 : MONTH_LENGTHS[month - 1];

/**
 * Days from 1970-01-01 to a civil date, by Howard Hinnant's era arithmetic.
 *
 * Exact and total over every year the literal admits, which a host `Date` is
 * not: its epoch is milliseconds in a float and its two-digit years are
 * remapped, so neither range nor precision would survive the round trip.
 */
const epochDayFromCivil = (
  year: bigint,
  month: bigint,
  day: bigint,
): bigint => {
  const shifted = month <= 2n ? year - 1n : year;
  const era = floorDiv(shifted, 400n);
  const yearOfEra = shifted - era * 400n;
  const monthTerm = month + (month > 2n ? -3n : 9n);
  const dayOfYear = (153n * monthTerm + 2n) / 5n + day - 1n;
  const dayOfEra = yearOfEra * 365n + yearOfEra / 4n - yearOfEra / 100n +
    dayOfYear;
  return era * 146097n + dayOfEra - 719468n;
};

/** The civil date for a day count, the exact inverse of the above. */
const civilFromEpochDay = (
  epochDay: bigint,
): readonly [bigint, bigint, bigint] => {
  const shifted = epochDay + 719468n;
  const era = floorDiv(shifted, 146097n);
  const dayOfEra = shifted - era * 146097n;
  const yearOfEra =
    (dayOfEra - dayOfEra / 1460n + dayOfEra / 36524n - dayOfEra / 146096n) /
    365n;
  const dayOfYear = dayOfEra -
    (365n * yearOfEra + yearOfEra / 4n - yearOfEra / 100n);
  const monthTerm = (5n * dayOfYear + 2n) / 153n;
  const day = dayOfYear - (153n * monthTerm + 2n) / 5n + 1n;
  const month = monthTerm + (monthTerm < 10n ? 3n : -9n);
  const year = yearOfEra + era * 400n + (month <= 2n ? 1n : 0n);
  return [year, month, day];
};

/**
 * The widest year the literal grammar admits, and the instants it bounds.
 *
 * Rendering is the contract, so the range a literal accepts is the range an
 * instant may hold: arithmetic that leaves it refuses rather than emitting a
 * spelling the reader would reject.
 */
const MAX_INSTANT_YEAR = 999999n;

const MIN_INSTANT_NANOS = epochDayFromCivil(-MAX_INSTANT_YEAR, 1n, 1n) *
  NANOS_PER_DAY;

const MAX_INSTANT_NANOS =
  (epochDayFromCivil(MAX_INSTANT_YEAR, 12n, 31n) + 1n) * NANOS_PER_DAY - 1n;

const pad = (value: bigint, width: number): string =>
  (value < 0n ? -value : value).toString().padStart(width, "0");

/** Years outside four digits are spelled with an explicit sign, per ISO 8601. */
const renderYear = (year: bigint): string =>
  year >= 0n && year <= 9999n
    ? pad(year, 4)
    : `${year < 0n ? "-" : "+"}${pad(year, 6)}`;

const renderFraction = (fraction: bigint): string =>
  fraction === 0n ? "" : `.${pad(fraction, 9).replace(/0+$/, "")}`;

/** The canonical UTC spelling of an instant, which re-reads as itself. */
const renderInstant = (nanos: bigint): string => {
  const [year, month, day] = civilFromEpochDay(floorDiv(nanos, NANOS_PER_DAY));
  const time = floorMod(nanos, NANOS_PER_DAY);
  const hour = time / NANOS_PER_HOUR;
  const minute = time % NANOS_PER_HOUR / NANOS_PER_MINUTE;
  const second = time % NANOS_PER_MINUTE / NANOS_PER_SECOND;
  const fraction = time % NANOS_PER_SECOND;
  return `${renderYear(year)}-${pad(month, 2)}-${pad(day, 2)}` +
    `T${pad(hour, 2)}:${pad(minute, 2)}:${pad(second, 2)}` +
    `${renderFraction(fraction)}Z`;
};

/** The canonical spelling of a duration, with weeks folded into days. */
const renderDuration = (nanos: bigint): string => {
  if (nanos === 0n) return "PT0S";

  const sign = nanos < 0n ? "-" : "";
  const magnitude = nanos < 0n ? -nanos : nanos;
  const days = magnitude / NANOS_PER_DAY;
  const withinDay = magnitude % NANOS_PER_DAY;
  const hours = withinDay / NANOS_PER_HOUR;
  const minutes = withinDay % NANOS_PER_HOUR / NANOS_PER_MINUTE;
  const seconds = withinDay % NANOS_PER_MINUTE / NANOS_PER_SECOND;
  const fraction = withinDay % NANOS_PER_SECOND;

  const date = days === 0n ? "" : `${days}D`;
  const time = (hours === 0n ? "" : `${hours}H`) +
    (minutes === 0n ? "" : `${minutes}M`) +
    (seconds === 0n && fraction === 0n
      ? ""
      : `${seconds}${renderFraction(fraction)}S`);
  return `${sign}P${date}${time === "" ? "" : `T${time}`}`;
};

const malformed = (body: string): Frame =>
  Frame.error(
    `$!.time-malformed ${FrameTime.TIME_DELIMITER}${body}${FrameTime.TIME_DELIMITER}`,
  );

const refuse = (reason: string, body: string): Frame =>
  Frame.error(
    `$!.${reason} ${FrameTime.TIME_DELIMITER}${body}${FrameTime.TIME_DELIMITER}`,
  );

/** The offset in nanoseconds, or undefined when the spelling is out of range. */
const offsetNanos = (offset: string): bigint | undefined => {
  if (offset === "Z") return 0n;
  const digits = offset.slice(1).replace(":", "");
  const hours = BigInt(digits.slice(0, 2));
  const minutes = digits.length > 2 ? BigInt(digits.slice(2)) : 0n;
  if (hours > 23n || minutes > 59n) return undefined;
  const magnitude = hours * NANOS_PER_HOUR + minutes * NANOS_PER_MINUTE;
  return offset.startsWith("-") ? -magnitude : magnitude;
};

const parseInstant = (body: string): Frame => {
  const matched = INSTANT.exec(body);
  if (matched === null) return malformed(body);

  const [
    ,
    yearText,
    monthText,
    dayText,
    hourText,
    minuteText,
    secondText,
    fractionText,
    offsetText,
  ] = matched;

  const year = BigInt(yearText);
  const month = BigInt(monthText);
  const day = BigInt(dayText);
  if (month < 1n || month > 12n) return malformed(body);
  if (day < 1n || day > BigInt(daysInMonth(year, Number(month)))) {
    return malformed(body);
  }

  if (hourText === undefined) {
    return new FrameDateTime(
      epochDayFromCivil(year, month, day) *
        NANOS_PER_DAY,
    );
  }
  if (offsetText === undefined) {
    return refuse("time-offset-required", body);
  }

  const hour = BigInt(hourText);
  const minute = BigInt(minuteText);
  const second = secondText === undefined ? 0n : BigInt(secondText);
  if (hour > 23n || minute > 59n || second > 59n) return malformed(body);

  const offset = offsetNanos(offsetText);
  if (offset === undefined) return malformed(body);

  const fraction = fractionText === undefined
    ? 0n
    : BigInt(fractionText.padEnd(9, "0"));

  const nanos = epochDayFromCivil(year, month, day) * NANOS_PER_DAY +
    hour * NANOS_PER_HOUR + minute * NANOS_PER_MINUTE +
    second * NANOS_PER_SECOND + fraction - offset;
  return new FrameDateTime(nanos);
};

const parseDuration = (body: string): Frame => {
  const datePart = body.replace(DURATION_START, "").split("T")[0];
  if (/[YM]/.test(datePart)) return refuse("time-duration-calendar", body);

  const matched = DURATION.exec(body);
  if (matched === null) return malformed(body);

  const [, sign, weeks, days, hours, minutes, seconds, fraction] = matched;
  const components = [weeks, days, hours, minutes, seconds];
  if (components.every((component) => component === undefined)) {
    return malformed(body);
  }

  const scaled = (text: string | undefined, unit: bigint): bigint =>
    text === undefined ? 0n : BigInt(text) * unit;

  const magnitude = scaled(weeks, NANOS_PER_WEEK) +
    scaled(days, NANOS_PER_DAY) + scaled(hours, NANOS_PER_HOUR) +
    scaled(minutes, NANOS_PER_MINUTE) + scaled(seconds, NANOS_PER_SECOND) +
    (fraction === undefined ? 0n : BigInt(fraction.padEnd(9, "0")));
  return new FrameDuration(sign === "-" ? -magnitude : magnitude);
};

/**
 * Builds one time value from a literal body, or a refusal.
 *
 * A malformed body answers a refusal rather than raising a lexical error: the
 * spelling is well-formed HC, and what it names is wrong, so the refusal is a
 * value the program can carry like any other.
 */
export const parseTimeLiteral = (body: string): Frame =>
  DURATION_START.test(body) ? parseDuration(body) : parseInstant(body);

/** Whitespace inside a literal means the delimiter was never closed. */
const recognizeTime = (symbol: Frame, source = ""): ScanResult => {
  const char = symbol.toString();
  if (char === FrameTime.TIME_DELIMITER) {
    // The `%%` ruling: the operator keeps the doubled spelling, so the family
    // hands it back instead of completing an empty literal.
    return source === ""
      ? {
        disposition: ScanDisposition.CompleteConsume,
        frame: new FrameOperator(FrameTime.MODULO),
      }
      : { disposition: ScanDisposition.CompleteConsume };
  }
  if (/\s/.test(char)) {
    return {
      disposition: ScanDisposition.Error,
      message: `unterminated FrameTime: ${FrameTime.TIME_DELIMITER}${source}`,
    };
  }
  return { disposition: ScanDisposition.Consume };
};

/** The kind an operand plays in the algebra, or undefined when it plays none. */
const dimensionOf = (frame: FrameNumeric): DimensionalKind | undefined => {
  if (frame instanceof FrameTime) return frame.dimension;
  return frame.exactRatio() === null ? undefined : "scalar";
};

const inexact = (
  operator: DimensionalOperator,
  left: Frame,
  right: Frame,
): Frame =>
  Frame.error(
    `$!.time-inexact ${operator} ${left.className()} ${right.className()}`,
  );

/**
 * An instant, or a refusal when it would fall outside the literal's range.
 *
 * Canonical output has to re-read as the same value, and `renderYear` can spell
 * a year wider than the grammar accepts, so the overflow is refused here for the
 * same reason an inexact scaling is: answering something the reader rejects is
 * worse than answering nothing.
 */
const instantWithinRange = (
  nanos: bigint,
  operator: DimensionalOperator,
  left: Frame,
  right: Frame,
): Frame =>
  nanos < MIN_INSTANT_NANOS || nanos > MAX_INSTANT_NANOS
    ? Frame.error(
      `$!.time-range ${operator} ${left.className()} ${right.className()}`,
    )
    : new FrameDateTime(nanos);

/**
 * Scales nanoseconds by an exact ratio, or refuses.
 *
 * Exactness is the contract, so a scaling that would not land on a whole
 * nanosecond is refused rather than rounded. Nanosecond resolution makes that a
 * narrow refusal in practice and a loud one when it happens.
 */
const scaleNanos = (
  nanos: bigint,
  scalar: FrameNumeric,
  invert: boolean,
  operator: DimensionalOperator,
  left: Frame,
  right: Frame,
): Frame | undefined => {
  const ratio = scalar.exactRatio();
  if (ratio === null) return undefined;

  const [numerator, denominator] = invert
    ? [ratio[1], ratio[0]]
    : [ratio[0], ratio[1]];
  if (denominator === 0n) return Frame.error("$!.division-by-zero /");

  const product = nanos * numerator;
  return product % denominator === 0n
    ? new FrameDuration(product / denominator)
    : inexact(operator, left, right);
};

/**
 * Applies one ordered pair, or undefined when the table names no result.
 *
 * Ordered, because the reflected case is a real case: `2 * %PT1H%` reaches the
 * scalar first, and a duration that only multiplied from the left would make the
 * operator's meaning depend on which side it was written.
 */
const combineOrdered = (
  operator: DimensionalOperator,
  left: FrameNumeric,
  right: FrameNumeric,
): Frame | undefined => {
  const leftKind = dimensionOf(left);
  const rightKind = dimensionOf(right);
  if (leftKind === undefined || rightKind === undefined) return undefined;

  const result = dimensionalResult(operator, leftKind, rightKind);
  if (result === undefined) return undefined;

  if (operator === "+" || operator === "-") {
    if (!(left instanceof FrameTime) || !(right instanceof FrameTime)) {
      return undefined;
    }
    const nanos = operator === "+"
      ? left.nanos + right.nanos
      : left.nanos - right.nanos;
    return result === "point"
      ? instantWithinRange(nanos, operator, left, right)
      : new FrameDuration(nanos);
  }

  if (operator === "*") {
    const interval = left instanceof FrameTime ? left : right;
    const scalar = left instanceof FrameTime ? right : left;
    if (!(interval instanceof FrameTime)) return undefined;
    return scaleNanos(interval.nanos, scalar, false, operator, left, right);
  }

  if (!(left instanceof FrameTime)) return undefined;
  if (result === "scalar") {
    if (!(right instanceof FrameTime)) return undefined;
    return FrameRational.create(left.nanos, right.nanos);
  }
  return scaleNanos(left.nanos, right, true, operator, left, right);
};

/** An exact time value: nanoseconds, and the kind it plays in the algebra. */
export abstract class FrameTime extends FrameNumeric {
  public static readonly TIME_DELIMITER = TIME_DELIMITER;
  /** The operator that keeps the doubled delimiter. */
  public static readonly MODULO = "%%";

  public static readonly SIGIL_STARTS = [
    { key: FrameTime.TIME_DELIMITER, mode: "atom" },
  ] as const satisfies readonly SigilStart[];

  public static readonly SYNTAX: AtomSyntax = {
    NAME: "FrameTime",
    SIGIL_STARTS: FrameTime.SIGIL_STARTS,
    recognize: recognizeTime,
    finish: unterminatedAtEnd("FrameTime", FrameTime.TIME_DELIMITER),
    fromSource: parseTimeLiteral,
  };

  public readonly rank: NumericRank | null = null;

  /** Whether this value is a position or a displacement. */
  public abstract readonly dimension: DimensionalKind;

  /**
   * @param nanos Nanoseconds, from the Unix epoch for an instant.
   */
  protected constructor(
    public readonly nanos: bigint,
    meta: Context = NilContext,
  ) {
    super(meta);
  }

  /** The canonical body this value prints between its delimiters. */
  public abstract canonical(): string;

  public override add(right: FrameNumeric): Frame {
    return combineOrdered("+", this, right) ?? this.operationError("+", right);
  }

  public override subtract(right: FrameNumeric): Frame {
    return combineOrdered("-", this, right) ?? this.operationError("-", right);
  }

  public override multiply(right: FrameNumeric): Frame {
    return combineOrdered("*", this, right) ?? this.operationError("*", right);
  }

  public override divide(right: FrameNumeric): Frame {
    return combineOrdered("/", this, right) ?? this.operationError("/", right);
  }

  public override lessThan(right: FrameNumeric): Frame {
    return this.ordered(right, "<", (comparison) => comparison < 0);
  }

  public override lessThanOrEqual(right: FrameNumeric): Frame {
    return this.ordered(right, "<=", (comparison) => comparison <= 0);
  }

  public override greaterThan(right: FrameNumeric): Frame {
    return this.ordered(right, ">", (comparison) => comparison > 0);
  }

  public override greaterThanOrEqual(right: FrameNumeric): Frame {
    return this.ordered(right, ">=", (comparison) => comparison >= 0);
  }

  /** Equality is by instant, so one moment spelled two ways is one value. */
  public override equals(right: Frame): Frame {
    return right instanceof FrameTime && right.dimension === this.dimension &&
        right.nanos === this.nanos
      ? Frame.all
      : Frame.nil;
  }

  public override isZero(): boolean {
    return this.nanos === 0n;
  }

  public override valueOf(): Frame {
    return Frame.error(`$!.numeric-domain projection ${this.className()}`);
  }

  public override string_prefix(): string {
    return FrameTime.TIME_DELIMITER;
  }

  public override string_suffix(): string {
    return FrameTime.TIME_DELIMITER;
  }

  protected override toData(): string {
    return this.canonical();
  }

  /**
   * The reflected half of the algebra.
   *
   * A ranked numeric on the left cannot know what a null-ranked peer means, so
   * it offers the operation here before reporting a domain error.
   */
  protected override combineFrom(
    operator: DimensionalOperator,
    left: FrameNumeric,
  ): Frame | undefined {
    return combineOrdered(operator, left, this);
  }

  protected override promoteOne(): FrameNumeric {
    return this;
  }

  protected override ratioParts(): null {
    return null;
  }

  protected override inexactResult(_value: number): Frame {
    return Frame.error(`$!.numeric-domain projection ${this.className()}`);
  }

  protected override integralValue(): null {
    return null;
  }

  protected override unaryPlus(): Frame {
    return this;
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
      `$!.numeric-domain ** ${this.className()} ${this.className()}`,
    );
  }

  protected override compareSame(right: FrameNumeric): -1 | 0 | 1 | null {
    if (!(right instanceof FrameTime) || right.dimension !== this.dimension) {
      return null;
    }
    if (this.nanos === right.nanos) return 0;
    return this.nanos < right.nanos ? -1 : 1;
  }

  /** Ordering is defined between peers of one kind and refused across kinds. */
  private ordered(
    right: FrameNumeric,
    operator: "<" | "<=" | ">" | ">=",
    predicate: (comparison: -1 | 0 | 1) => boolean,
  ): Frame {
    const comparison = this.compareSame(right);
    if (comparison === null) return this.operationError(operator, right);
    return predicate(comparison) ? Frame.all : Frame.nil;
  }
}

/** An instant: a point on the line, which only differences relate. */
export class FrameDateTime extends FrameTime {
  /** Builds an instant from ISO text, for a harness or a test. */
  public static at(text: string): FrameDateTime {
    const parsed = parseTimeLiteral(text);
    if (!(parsed instanceof FrameDateTime)) {
      throw new TypeError(`invalid instant: ${text}`);
    }
    return parsed;
  }

  /** Builds an instant from the milliseconds a host clock reports. */
  public static fromEpochMillis(millis: number): FrameDateTime {
    return new FrameDateTime(BigInt(millis) * NANOS_PER_MILLISECOND);
  }

  public readonly dimension: DimensionalKind = "point";

  public constructor(nanos: bigint, meta: Context = NilContext) {
    super(nanos, meta);
  }

  public override canonical(): string {
    return renderInstant(this.nanos);
  }

  /** An instant has no negation: a position reversed is not a position. */
  protected override unaryMinus(): Frame {
    return Frame.error(`$!.numeric-domain unary- ${this.className()}`);
  }
}

/** A duration: a signed displacement, which adds to instants and scales. */
export class FrameDuration extends FrameTime {
  /** Builds a duration from ISO text, for a harness or a test. */
  public static of(text: string): FrameDuration {
    const parsed = parseTimeLiteral(text);
    if (!(parsed instanceof FrameDuration)) {
      throw new TypeError(`invalid duration: ${text}`);
    }
    return parsed;
  }

  public readonly dimension: DimensionalKind = "interval";

  public constructor(nanos: bigint, meta: Context = NilContext) {
    super(nanos, meta);
  }

  public override canonical(): string {
    return renderDuration(this.nanos);
  }

  protected override unaryMinus(): Frame {
    return new FrameDuration(-this.nanos);
  }
}
