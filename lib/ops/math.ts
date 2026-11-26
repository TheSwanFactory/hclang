// Direct, not ../frames.ts, whose ../ops.ts needs this module loaded first.
import { Frame } from "../frames/frame.ts";
import { FrameNumeric } from "../frames/frame-numeric.ts";
import { FrameArray } from "../frames/frame-array.ts";
import { FrameCount } from "../frames/frame-count.ts";
import { FrameGroup } from "../frames/frame-group.ts";
import { FrameString } from "../frames/frame-string.ts";
import { REPETITION_ELEMENT_LIMIT } from "../frames/frame-numeric.ts";
import { CartElements, FlopElements } from "./pairings.ts";

type NumericOperation = (left: FrameNumeric, right: FrameNumeric) => Frame;

/** The operators whose non-numeric operands are a numeric-domain error. */

type DomainOperator = "%%" | "**" | "<" | "<=" | ">" | ">=";

/**
 * The refusal for a pair that is not two numbers, in the vocabulary
 * `FrameNumeric.operationError` uses for a pair of numbers that do not
 * combine: `2 %% “a”` is `$!.numeric-domain %% FrameCount FrameString`.
 */
const domainError = (
  operator: DomainOperator,
  source: Frame,
  block: Frame,
): Frame =>
  Frame.error(
    `$!.numeric-domain ${operator} ${source.className()} ${block.className()}`,
  );

/**
 * Arithmetic answers an operand that is already an error, left first, so a
 * failed read such as `$!.name-missing` reaches whatever uses the result. As
 * nil it vanished: a write of nil leaves a field unchanged, so a misread load
 * looked like an update that never landed (011.20). Ordering uses the same
 * rule: diagnostic failures now short-circuit before `?` (#467).
 *
 * A pair of referents that is not two numbers answers `refuse` on them. It
 * answered nil until #361, which for ordering read the same as false.
 */
const arithmetic = (
  source: Frame,
  block: Frame,
  operation: NumericOperation,
  refuse: (source: Frame, block: Frame) => Frame,
): Frame => {
  const refused = failure(source) ?? failure(block);
  if (refused) return refused;
  const left = source.referent();
  const right = block.referent();
  return left instanceof FrameNumeric && right instanceof FrameNumeric
    ? operation(left, right)
    : refuse(left, right);
};

/** Arithmetic whose only meaning is numeric: `%%` and `**`. */

const numericOnly = (
  operator: DomainOperator,
  operation: NumericOperation,
) =>
(source: Frame, block: Frame): Frame =>
  arithmetic(
    source,
    block,
    operation,
    (left, right) => domainError(operator, left, right),
  );

/** An operand that is an error value (`Frame.isError`), unwrapped. */

const failure = (operand: Frame): Frame | undefined => {
  const value = operand.referent();
  return value.isError() ? value : undefined;
};

/**
 * Arithmetic with a structural meaning beside the numeric one: an error
 * operand first, left before right, then the numeric pair of the referents,
 * and otherwise `fallback` on the operands as written.
 */
const arithmeticOr = (
  source: Frame,
  block: Frame,
  operation: NumericOperation,
  fallback: (source: Frame, block: Frame) => Frame,
): Frame => arithmetic(source, block, operation, () => fallback(source, block));

/** Exact numeric arithmetic survives for the core scalar ladder. */

export const Add = (source: Frame, block: Frame): Frame =>
  arithmeticOr(source, block, (left, right) => left.add(right), FlopElements);

/** Numeric pairs subtract; otherwise subtraction Flops with a Denum half-turn.
 * The right operand must be a Denum. A numeric left receiver is valid Flop,
 * so 0 - D is not the same as unary -D.
 */
export const Subtract = (source: Frame, block: Frame): Frame =>
  arithmeticOr(
    source,
    block,
    (left, right) => left.subtract(right),
    (source, block) => {
      const negative = Frame.negateDenum(block.referent());
      return negative
        ? FlopElements(source, negative)
        : Frame.error("$!.flop-domain -");
    },
  );

/** Cart is the structural Frame product; scalar arithmetic remains native. */

export const Multiply = (source: Frame, block: Frame): Frame =>
  arithmeticOr(
    source,
    block,
    (left, right) => left.multiply(right),
    CartElements,
  );

/**
 * `/`, also spelled `./`. A numeric pair keeps the exact numeric ladder. An
 * ordered aggregate, an array or a group, divided by a positive Count n is
 * dealt into n channels (007.27): the element at index i goes to channel
 * i mod n, so `[A, B, C, D, E, F, G] / 3` is the n-channel `RotorRouter`
 * whose channels are `[[A, D, G], [B, E], [C, F]]`. Any other pair that is
 * not two numbers is `$!.division-domain /`, as a list's bad divisor is (#361).
 */
export const Divide = (source: Frame, block: Frame): Frame => {
  const left = source.referent();
  if (left instanceof FrameArray || left instanceof FrameGroup) {
    return failure(left) ?? failure(block) ?? deal(left, block);
  }
  return arithmetic(
    source,
    block,
    (left, right) => left.divide(right),
    () => Frame.error("$!.division-domain /"),
  );
};

/**
 * Literal division of an ordered aggregate into `n` channels (007.26, 007.27).
 *
 * Each immediate element is dealt whole, in order, round-robin from channel 0:
 * the same Frame, never copied, evaluated, measured or flattened, so identity,
 * nesting and duplicates are kept and every element lands in exactly one
 * channel. Properties are not elements, so they are not dealt. The channels
 * are exactly n fresh arrays, empty channels included; for n greater than the
 * element count the last channels are empty.
 *
 * The answer is a `RotorRouter` holding those channels, not a bare list of
 * lists (007.27c). A list whose children happen to be lists is a plain list,
 * and dividing it deals those children whole; a router keeps its channels as
 * channels, so dividing it again reads them breadth-first and re-deals the
 * same Frames, which makes `(X ./ n) ./ m` equal `X ./ m`.
 *
 * The divisor is the channel Count itself, never a Size read from it: it must
 * be a Count, and zero is `$!.division-by-zero /` as it is for numbers. Any
 * other divisor, a negative or fractional number, text, an aggregate or a
 * Denum, is `$!.division-domain /`. The answer allocates one array per
 * channel, so a divisor that is both above 1,000,000, the limit repetition
 * uses for elements, and above the element count is
 * `$!.repetition-size 1000000`, checked before anything is allocated. Up to
 * the element count is always allowed, so the answer stays proportional to
 * its input: a router's breadth-first readout divides by its longest
 * channel's length, which never exceeds the Frames it holds (PR #482 review).
 */
/**
 * Builds the value a list division answers from its n channel arrays: a
 * `RotorRouter` of the HC class in `hc/rotor-router.hc`, which keeps the
 * channels as channels (007.27c). This package cannot run HC, so the evaluator
 * installs it (`lib/execute/router-prologue.ts`).
 */
export type DivisionCarrier = (channels: FrameArray) => Frame;

let carrier: DivisionCarrier | undefined;

/**
 * Installs what list division answers its channels with.
 *
 * @param construct The constructor, called once per division.
 */
export function installDivisionCarrier(construct: DivisionCarrier): void {
  carrier = construct;
}

const deal = (source: FrameArray | FrameGroup, block: Frame): Frame => {
  const divisor = block.referent();
  if (!(divisor instanceof FrameCount) || typeof divisor.data !== "bigint") {
    return Frame.error("$!.division-domain /");
  }
  if (divisor.data === 0n) return Frame.error("$!.division-by-zero /");
  const elements = source.elements();
  if (
    divisor.data > REPETITION_ELEMENT_LIMIT &&
    divisor.data > BigInt(elements.length)
  ) {
    return Frame.error(`$!.repetition-size ${REPETITION_ELEMENT_LIMIT}`);
  }
  const n = Number(divisor.data);
  const channels: Frame[][] = Array.from({ length: n }, () => []);
  elements.forEach((element, index) => {
    channels[index % n].push(element);
  });
  if (!carrier) return Frame.error("$!.router-unavailable /");
  return carrier(
    new FrameArray(channels.map((channel) => new FrameArray(channel))),
  );
};

export const Modulo = numericOnly(
  "%%",
  (left, right) => left.modulo(right),
);

export const Power = numericOnly("**", (left, right) => left.power(right));

export const Equals = (source: Frame, block: Frame): Frame => {
  return failure(source) ?? failure(block) ?? source.equals(block);
};

/** `==`: the same value and the same type at every node. */

export const TypeEquals = (source: Frame, block: Frame): Frame => {
  return failure(source) ?? failure(block) ?? source.typeEquals(block);
};

/** `===`: the same frame. Atoms, which own no identity, fall back to `==`. */

export const Identical = (source: Frame, block: Frame): Frame => {
  return failure(source) ?? failure(block) ?? source.identical(block);
};

/**
 * How two texts order: by Unicode code point, element by element, with a
 * proper prefix first (#568). JavaScript's `<` compares UTF-16 code units,
 * which puts a character outside the Basic Multilingual Plane, stored as a
 * surrogate pair, before U+E000–U+FFFF; iterating a string yields code points.
 * Locale-aware collation is out of scope.
 */
const compareCodePoints = (left: string, right: string): -1 | 0 | 1 => {
  const rightPoints = right[Symbol.iterator]();
  for (const character of left) {
    const next = rightPoints.next();
    if (next.done) return 1;
    const difference = character.codePointAt(0)! - next.value.codePointAt(0)!;
    if (difference !== 0) return difference < 0 ? -1 : 1;
  }
  return rightPoints.next().done ? 0 : -1;
};

/**
 * The ordering operators, `.<` and its kin. Two numbers order on the numeric
 * ladder and two strings by code point (#568); either answers `<>` when the
 * comparison holds and nil when it does not. Any other pair is a
 * numeric-domain error (#361), since nil here would read as false.
 */
const ordering = (
  operator: DomainOperator,
  operation: NumericOperation,
  holds: (comparison: -1 | 0 | 1) => boolean,
) =>
(source: Frame, block: Frame): Frame =>
  arithmetic(source, block, operation, (left, right) => {
    if (left instanceof FrameString && right instanceof FrameString) {
      const comparison = compareCodePoints(
        left.characterContent(),
        right.characterContent(),
      );
      return holds(comparison) ? Frame.all : Frame.nil;
    }
    return domainError(operator, left, right);
  });

export const GreaterThan = ordering(
  ">",
  (left, right) => left.greaterThan(right),
  (comparison) => comparison > 0,
);

export const GreaterThanOrEqual = ordering(
  ">=",
  (left, right) => left.greaterThanOrEqual(right),
  (comparison) => comparison >= 0,
);

export const LessThan = ordering(
  "<",
  (left, right) => left.lessThan(right),
  (comparison) => comparison < 0,
);

export const LessThanOrEqual = ordering(
  "<=",
  (left, right) => left.lessThanOrEqual(right),
  (comparison) => comparison <= 0,
);
