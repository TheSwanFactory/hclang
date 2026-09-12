/**
 * Which operand kinds combine, and what they answer.
 *
 * Datetime and duration are a two-element instance of the general dimensional
 * rule, not a special case of time: an instant is a point on a line, a duration
 * is an interval on it, and the algebra that relates them is the affine one.
 * Writing it as a table rather than as branches inside a frame class is what
 * keeps the units work from becoming a parallel implementation of the same
 * rules — a dimensioned quantity is an interval on its own line, and a plain
 * number is the scalar.
 *
 * The table is the whole ruling. A combination it does not name has no meaning,
 * so the caller answers a type error rather than inventing one, which is how
 * `datetime + datetime` becomes an error frame instead of a second datetime.
 *
 * @module
 */

/**
 * One operand's place in the algebra.
 *
 * - `point` — an absolute position, which only differences relate.
 * - `interval` — a signed displacement, which adds and scales.
 * - `scalar` — a dimensionless number, which only scales.
 */
export type DimensionalKind = "point" | "interval" | "scalar";

/** The arithmetic the table rules on. */
export type DimensionalOperator = "+" | "-" | "*" | "/";

/**
 * Every combination that means something, keyed by operator and operand kinds.
 *
 * Read the omissions as deliberately as the entries: `+ point point` has no
 * meaning because adding two positions depends on an origin the values do not
 * carry, and `- interval point` is refused because subtraction is not
 * commutative and a displacement minus a position is not a position.
 */
const RESULTS: Readonly<Record<string, DimensionalKind>> = Object.freeze({
  "+ point interval": "point",
  "+ interval point": "point",
  "+ interval interval": "interval",
  "+ scalar scalar": "scalar",
  "- point point": "interval",
  "- point interval": "point",
  "- interval interval": "interval",
  "- scalar scalar": "scalar",
  "* interval scalar": "interval",
  "* scalar interval": "interval",
  "* scalar scalar": "scalar",
  "/ interval scalar": "interval",
  "/ interval interval": "scalar",
  "/ scalar scalar": "scalar",
});

/** The kind this combination answers, or undefined when it has no meaning. */
export const dimensionalResult = (
  operator: DimensionalOperator,
  left: DimensionalKind,
  right: DimensionalKind,
): DimensionalKind | undefined => RESULTS[`${operator} ${left} ${right}`];
