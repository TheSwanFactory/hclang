/**
 * The proleptic Gregorian calendar that time literals are spelled in.
 *
 * An instant is nanoseconds from the Unix epoch in a bigint, and this module is
 * the exact arithmetic between that count and a civil date: the unit factors,
 * the day count for a civil date and its inverse, the range an instant may
 * hold, and the canonical spellings of an instant and a duration. It imports
 * nothing, so `frame-time.ts` owns the literal grammar and the algebra while
 * the calendar rules live in one place.
 *
 * @module
 */
/** Nanoseconds per second, and the units above it. */
export const NANOS_PER_SECOND = 1_000_000_000n;
/** Nanoseconds per minute. */
export const NANOS_PER_MINUTE = 60n * NANOS_PER_SECOND;
/** Nanoseconds per hour. */
export const NANOS_PER_HOUR = 60n * NANOS_PER_MINUTE;
/** Nanoseconds per day. */
export const NANOS_PER_DAY = 24n * NANOS_PER_HOUR;
/** Nanoseconds per week. */
export const NANOS_PER_WEEK = 7n * NANOS_PER_DAY;

/** Days in each month of a non-leap year. */
const MONTH_LENGTHS = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

/** Division rounded toward negative infinity. */
const floorDiv = (value: bigint, divisor: bigint): bigint => {
  const quotient = value / divisor;
  const inexact = value % divisor !== 0n;
  return inexact && (value < 0n) !== (divisor < 0n) ? quotient - 1n : quotient;
};

/** The remainder that pairs with `floorDiv`, with the divisor's sign. */
const floorMod = (value: bigint, divisor: bigint): bigint =>
  value - floorDiv(value, divisor) * divisor;

/** Whether a proleptic Gregorian year has a February 29. */
const isLeapYear = (year: bigint): boolean =>
  year % 4n === 0n && (year % 100n !== 0n || year % 400n === 0n);

/** Days in a month (1-12) of a year. */
export const daysInMonth = (year: bigint, month: number): number =>
  month === 2 && isLeapYear(year) ? 29 : MONTH_LENGTHS[month - 1];

/**
 * Days from 1970-01-01 to a civil date, by Howard Hinnant's era arithmetic.
 *
 * Exact and total over every year the literal admits, which a host `Date` is
 * not: its epoch is milliseconds in a float and its two-digit years are
 * remapped, so neither range nor precision would survive the round trip.
 */
export const epochDayFromCivil = (
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

/** The earliest instant: the start of the widest negative year. */
export const MIN_INSTANT_NANOS = epochDayFromCivil(-MAX_INSTANT_YEAR, 1n, 1n) *
  NANOS_PER_DAY;

/** The latest instant: the last nanosecond of the widest positive year. */
export const MAX_INSTANT_NANOS =
  (epochDayFromCivil(MAX_INSTANT_YEAR, 12n, 31n) + 1n) * NANOS_PER_DAY - 1n;

/** The magnitude of a value in decimal, zero-padded to a width. */
const pad = (value: bigint, width: number): string =>
  (value < 0n ? -value : value).toString().padStart(width, "0");

/** Years outside four digits are spelled with an explicit sign, per ISO 8601. */
const renderYear = (year: bigint): string =>
  year >= 0n && year <= 9999n
    ? pad(year, 4)
    : `${year < 0n ? "-" : "+"}${pad(year, 6)}`;

/** A fraction of a second as `.digits` without trailing zeros, or nothing. */
const renderFraction = (fraction: bigint): string =>
  fraction === 0n ? "" : `.${pad(fraction, 9).replace(/0+$/, "")}`;

/** The canonical UTC spelling of an instant, which re-reads as itself. */
export const renderInstant = (nanos: bigint): string => {
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
export const renderDuration = (nanos: bigint): string => {
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
