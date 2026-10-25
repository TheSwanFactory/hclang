// Direct, not ../frames.ts, whose ../ops.ts needs this module loaded first.
import { Frame } from "../frames/frame.ts";
import { FrameArray } from "../frames/frame-array.ts";
import { FrameSymbol } from "../frames/frame-symbol.ts";
import { FrameLazy } from "../frames/frame-lazy.ts";
import { FrameList } from "../frames/frame-list.ts";
import { FrameWord } from "../frames/frame-word.ts";
import { closureFromAtoms } from "../frames/reread.ts";
import type { ReceiverState } from "../frames/bound-method.ts";

/**
 * Iteration is application, twice.
 *
 * Both operators apply each streamed value to the value on their right, and
 * differ only in what becomes of each answer: a reduce keeps it as the receiver
 * for the next value, a map keeps the answers apart. Neither adds a verb, and
 * neither inspects what it was handed, so a text receiver is as ordinary as a
 * closure and there is no second calling convention to learn.
 *
 * Doubling an operator changes what is applied rather than what happens to the
 * answer: the stream widens from values to `[key, value]` tuples, where the key
 * is the symbol that addresses the member. The tuple exists only as an
 * iteration argument; no pair is stored.
 */

/** Pairs an address with the value it names, for one step of a doubled stream. */
const tuple = (key: string, value: Frame): FrameArray =>
  new FrameArray([FrameSymbol.address(key), value]);

/**
 * The complete view of a value: visible properties, then elements by index.
 *
 * Print order and iteration order are the same order, which is what keeps
 * canonical output re-readable as input.
 */
const members = (source: Frame): Frame[] => {
  const properties = source.visibleKeys().map((key) =>
    tuple(key, source.get_here(key))
  );
  const elements = source.elements().map((value, index) =>
    tuple(index.toString(), value)
  );
  return [...properties, ...elements];
};

/**
 * `&` applies each element on its own and keeps the answers apart.
 *
 * A map never accumulates into its receiver (#417): each element is applied
 * to the receiver's collecting copy, a fresh aggregate sharing its members,
 * as applying through an immutable name already does. A reduce may write its
 * fresh intermediate in place because only the final answer escapes; a map
 * answers once per element, so an aggregate that no name holds would
 * otherwise collect every element and be answered each time.
 */
export const MapElements = (
  source: Frame,
  receiver: Frame,
  receiverState?: ReceiverState,
): FrameArray =>
  new FrameArray(
    source.elements().map((value) =>
      receiver.collectingCopy().call(value, Frame.nil, receiverState)
    ),
  );

/**
 * `&|` applies each element on its own, as `&` does, and splices the answers
 * into one fresh array: each answer contributes its elements, in order and
 * shared, and a nil answer contributes nothing (#421). Anything which is not
 * an aggregate is its own single element, so `xs &| {_}` concatenates the
 * aggregates xs holds, and a block that answers nil for some elements filters.
 */
export const SpliceElements = (
  source: Frame,
  receiver: Frame,
  receiverState?: ReceiverState,
): FrameArray =>
  new FrameArray(
    source.elements().flatMap((value) => {
      const answer = receiver.collectingCopy().call(
        value,
        Frame.nil,
        receiverState,
      );
      return answer.is.void ? [] : answer.elements();
    }),
  );

/**
 * `|` threads each element through the receiver the last step answered.
 *
 * Folding code runs it (#429). A fold applies each element to the answer so
 * far, which is what the evaluator does with terms, except that the evaluator
 * keeps the scope apart from the running answer: folding atoms one at a time
 * would look the second name up in the first answer. So a closure is called
 * with the receiver, and a stream holding a walked word is re-read as the
 * closure it spells and called the same way: `{x + 1} | (.x 5)` is `6`, and
 * `{…} | (args)` is a second spelling of `{…} (args)`.
 */
export const ReduceElements = (
  source: Frame,
  receiver: Frame,
  receiverState?: ReceiverState,
): Frame => {
  const code = source.referent();
  if (code instanceof FrameLazy) {
    return code.call(receiver, Frame.nil, receiverState);
  }
  // Only an aggregate is inspected: a stream's elements are produced by
  // reading it, and the read belongs to the fold.
  if (code instanceof FrameList) {
    const values = code.elements();
    if (values.some((value) => value instanceof FrameWord)) {
      return closureFromAtoms(values).call(receiver, Frame.nil, receiverState);
    }
  }
  return source.reduce(receiver, receiverState);
};

/** `&&` maps the same stream widened to `[key, value]` tuples, as `&` does. */
export const MapMembers = (
  source: Frame,
  receiver: Frame,
  receiverState?: ReceiverState,
): FrameArray =>
  new FrameArray(
    members(source).map((member) =>
      receiver.collectingCopy().call(member, Frame.nil, receiverState)
    ),
  );

/** `||` reduces that widened stream, threading exactly as `|` does. */
export const ReduceMembers = (
  source: Frame,
  receiver: Frame,
  receiverState?: ReceiverState,
): Frame => Frame.reduceInto(members(source), receiver, receiverState);
