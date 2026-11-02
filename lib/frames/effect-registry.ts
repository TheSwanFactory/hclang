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
 *   committed mutation and does not stop its siblings; its result is observed
 *   by the registry only (the mutator is not interrupted).
 * - **Nested mutation / reentrancy.** While a value's callbacks are running, a
 *   further committed mutation of that same value does not re-enter its
 *   callback set. The nested write still commits; it simply does not recurse
 *   the notification in flight, which bounds delivery.
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
 * Notifies a managed value's subscribers that it committed a mutation.
 *
 * The single seam called from the mutation commit points. It is a no-op for the
 * overwhelming majority of frames, which carry no subscribers, so ordinary
 * construction and mutation pay only a `WeakMap.has` check. A value already
 * firing is skipped to bound reentrant nested mutation.
 */
export function notifyEffect(managed: Frame): void {
  const observers = subscribers.get(managed);
  if (!observers || !invoke || firing.has(managed)) return;
  firing.add(managed);
  try {
    // Snapshot so a callback that registers another arrow on this same value
    // does not extend the set being delivered this round.
    for (const callback of [...observers]) {
      invoke(callback, managed);
    }
  } finally {
    firing.delete(managed);
  }
}
