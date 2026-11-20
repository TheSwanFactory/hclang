import { Frame } from "../frames/frame.ts";
import { FrameArray } from "../frames/frame-array.ts";

/**
 * Native Cart: flat, left-major Cartesian pairing of immediate elements.
 *
 * Like HC's other element iterators, this reads the positional element plane;
 * named properties are not inputs. Repeated occurrences remain repeated.
 * Pairing is structural: each result is a two-element Frame, and neither
 * operand is evaluated, modified, or recursively traversed. As with `&`,
 * scalars are singleton elements and closures expose their source-code atoms.
 */
export const CartElements = (left: Frame, right: Frame): FrameArray => {
  const pairs: Frame[] = [];
  const rightElements = right.elements();
  for (const a of left.elements()) {
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
