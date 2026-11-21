import { Frame } from "../frames/frame.ts";
import { FrameArray } from "../frames/frame-array.ts";
import { FrameCount } from "../frames/frame-count.ts";
import { tryDenumState } from "../frames/fourth-hash.ts";

/** Maximum materialized pairs in a single public structural Cart. */
export const CART_MAX_PAIRS = 262144;

/** Denums expose their raw load occurrences as the structural element plane. */
export const cartInputs = (source: Frame): Frame[] => {
  const state = tryDenumState(source);
  return state
    ? state.loads.map((n) => new FrameCount(n))
    : source.referent().elements();
};

/** FOIST 19a: Flop applies B's immediate children into a fresh A, in order. */
export const FlopElements = (left: Frame, right: Frame): Frame => {
  const a = left.referent();
  const b = right.referent();
  if (a.observationError()) return a;
  if (b.observationError()) return b;
  return Frame.reduceInto(cartInputs(b), a.collectingCopy());
};

/**
 * Native Cart: flat, left-major Cartesian pairing of immediate elements.
 *
 * Like HC's other element iterators, this reads the positional element plane;
 * named properties are not inputs. Repeated occurrences remain repeated.
 * Pairing is structural: each result is a two-element Frame, and neither
 * operand is evaluated, modified, or recursively traversed. As with `&`,
 * scalars are singleton elements and closures expose their source-code atoms.
 */
export const CartElements = (left: Frame, right: Frame): Frame => {
  const leftElements = cartInputs(left);
  const rightElements = cartInputs(right);
  // Check before allocating the potentially massive Cartesian product.
  if (
    leftElements.length > 0 &&
    rightElements.length >
      Math.floor(CART_MAX_PAIRS / leftElements.length)
  ) {
    return Frame.error("$!.cart-product-budget *");
  }
  const pairs: Frame[] = [];
  for (const a of leftElements) {
    for (const b of rightElements) {
      pairs.push(new FrameArray([a, b]));
    }
  }
  return new FrameArray(pairs);
};

/**
 * Native Zip: pair positional elements in lockstep, truncating to the shorter
 * input. An operand with no positional elements returns an empty Frame;
 * scalars remain singleton elements. Named properties are excluded.
 */
export const ZipElements = (left: Frame, right: Frame): FrameArray => {
  const leftElements = left.elements();
  const rightElements = right.elements();
  const count = Math.min(leftElements.length, rightElements.length);
  const pairs: Frame[] = [];
  for (let i = 0; i < count; i++) {
    pairs.push(new FrameArray([leftElements[i], rightElements[i]]));
  }
  return new FrameArray(pairs);
};
