import type { Frame } from "./frame.ts";

/**
 * The effect-boundary registry for the `A -> B` arrow (occurrence/history
 * 006.17 §3–§4).
 *
 * An arrow is an *effect boundary*, not a write-authority boundary. `A -> B`
 * registers the callback `B` on the value that `A` manages. A later *committed*
 * mutation of that value — by any actor, through any alias — is a new
 * invocation of `B`. Registration does not grant, withhold, or depend on write
 * permission; it does not freeze, copy, or convert the managed value; and it is
 * not a returned-handle permission gate.
 *
 * This module owns the registry and the single notification seam. The commit
 * point is `MetaFrame.set` (named-property writes) and `replaceMember`
 * (element writes): every committed mutation in the runtime lands there, so a
 * callback registered on a value fires for every actor that writes it and for
 * none that merely fails or rolls back (a refused write returns before `set`,
 * and a functional update writes a *copy* that carries no subscribers).
 *
 * ## Operational policy (006.17 §4 leaves these to the implementation)
 *
 * - **Registration identity.** Subscribers are keyed by the managed value's
 *   object identity. The same callback registered twice on the same value is
 *   recorded once; distinct callbacks accumulate and fire in registration
 *   order.
 * - **Delivery.** Synchronous, immediately after the write commits, in
 *   registration order. Deterministic, no queue or event loop.
 * - **Callback failure.** A callback that fails does not undo the already
 *   committed mutation and does not stop its siblings. An HC failure is a
 *   returned Frame, observed by the registry only (the mutator is not
 *   interrupted). A host exception thrown by a callback is caught so that the
 *   remaining callbacks and rounds still run; the first such exception is
 *   rethrown once delivery for the outermost commit has finished, so a host
 *   bug is never silently swallowed (PR #475 review).
 * - **Nested mutation / reentrancy.** Every committed mutation is a new
 *   invocation, nested ones included (PR #475 review). While a value's
 *   callbacks are running, a further committed mutation of that same value
 *   does not recurse into the round in flight: it is counted, and each counted
 *   commit is delivered as one more round, in order, after the current round
 *   finishes. A callback that keeps mutating its own value would never
 *   finish, so delivery for one outermost commit is bounded at
 *   `EFFECT_DELIVERY_LIMIT` rounds; past it, delivery stops by throwing a
 *   `RangeError` (`$!.effect-delivery-limit`), as unbounded recursion stops
 *   with a stack overflow. A mutation of a *different* managed value during
 *   delivery fires that value's callbacks immediately, depth first.
 *
 * No cancellation, unsubscription, lifetime, or GC management is modeled:
 * registrations persist, matching 006.17's "defined once, lives forever" model.
 *
 * @module
 */

/** How a registered callback is invoked when its managed value mutates. */
export type EffectInvoker = (callback: Frame, managed: Frame) => Frame;

/** Subscribers registered on one managed value, in registration order. */
const subscribers = new WeakMap<Frame, Frame[]>();

/** Managed values whose callbacks are currently running, to bound reentrancy. */
const firing = new WeakSet<Frame>();

/** Committed nested mutations of a firing value, each owed one more round. */
const pending = new Map<Frame, number>();

/** The most delivery rounds one outermost commit may cause (nested included). */
export const EFFECT_DELIVERY_LIMIT = 65_536;

/**
 * The invoker is installed once by the runtime so this module need not import
 * closure machinery (which would close an import cycle through `frame.ts`).
 * Until it is installed, a registered callback is simply not called.
 */
let invoke: EffectInvoker | undefined;

/** Installs the one callback-invocation strategy (called at startup). */
export function installEffectInvoker(invoker: EffectInvoker): void {
  invoke = invoker;
}

/**
 * Registers `callback` as an effect-boundary observer of `managed`.
 *
 * Idempotent per (managed, callback) pair so re-declaring the same arrow does
 * not multiply invocations. Returns the managed value so the arrow operator can
 * answer it unchanged.
 */
export function registerEffect(managed: Frame, callback: Frame): Frame {
  const existing = subscribers.get(managed);
  if (!existing) {
    subscribers.set(managed, [callback]);
    return managed;
  }
  if (!existing.includes(callback)) existing.push(callback);
  return managed;
}

/** Whether a value carries any effect-boundary subscribers. */
export function hasEffectSubscribers(managed: Frame): boolean {
  return subscribers.has(managed);
}

/**
 * Whether `observer` itself is registered on `managed` by an `A -> B` arrow,
 * so a committed mutation of `managed` invokes it. Another callback on the
 * same value does not count (PR #475 review).
 */
export function isEffectObserver(managed: Frame, observer: Frame): boolean {
  return subscribers.get(managed)?.includes(observer) ?? false;
}

/**
 * Notifies a managed value's subscribers that it committed a mutation.
 *
 * The single seam called from the mutation commit points. It is a no-op for the
 * overwhelming majority of frames, which carry no subscribers, so ordinary
 * construction and mutation pay only a `WeakMap.has` check. A commit to a value
 * already firing is deferred to a later round rather than dropped.
 */
export function notifyEffect(managed: Frame): void {
  if (!subscribers.has(managed) || !invoke) return;
  if (firing.has(managed)) {
    pending.set(managed, (pending.get(managed) ?? 0) + 1);
    return;
  }
  firing.add(managed);
  let thrown: { error: unknown } | undefined;
  try {
    let due = 1;
    for (let rounds = 1; due > 0; rounds++) {
      if (rounds > EFFECT_DELIVERY_LIMIT) {
        throw new RangeError(
          `$!.effect-delivery-limit ${EFFECT_DELIVERY_LIMIT}`,
        );
      }
      due--;
      // Snapshot each round, so an arrow registered by a callback joins the
      // next round rather than the one being delivered.
      for (const callback of [...subscribers.get(managed)!]) {
        try {
          invoke(callback, managed);
        } catch (error) {
          thrown ??= { error };
        }
      }
      due += pending.get(managed) ?? 0;
      pending.delete(managed);
    }
  } finally {
    firing.delete(managed);
    pending.delete(managed);
  }
  if (thrown) throw thrown.error;
}
