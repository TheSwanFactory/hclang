import { Frame, FrameArray, FrameSymbol } from "../frames.ts";
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

/** `&` applies each element on its own and keeps the answers apart. */
export const MapElements = (
  source: Frame,
  receiver: Frame,
  receiverState?: ReceiverState,
): FrameArray =>
  new FrameArray(
    source.elements().map((value) =>
      receiver.call(value, Frame.nil, receiverState)
    ),
  );

/** `|` threads each element through the receiver the last step answered. */
export const ReduceElements = (
  source: Frame,
  receiver: Frame,
  receiverState?: ReceiverState,
): Frame => source.reduce(receiver, receiverState);

/** `&&` maps the same stream widened to `[key, value]` tuples. */
export const MapMembers = (
  source: Frame,
  receiver: Frame,
  receiverState?: ReceiverState,
): FrameArray =>
  new FrameArray(
    members(source).map((member) =>
      receiver.call(member, Frame.nil, receiverState)
    ),
  );

/** `||` reduces that widened stream, threading exactly as `|` does. */
export const ReduceMembers = (
  source: Frame,
  receiver: Frame,
  receiverState?: ReceiverState,
): Frame => Frame.reduceInto(members(source), receiver, receiverState);
