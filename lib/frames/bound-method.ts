import { Frame } from "./frame.ts";
import type { FrameLazy } from "./frame-lazy.ts";

/** Runtime brand for receiver writes authorized only by BoundMethod. */
const RECEIVER_WRITE_AUTHORIZED = Symbol("receiverWriteAuthorized");

/**
 * Per-invocation receiver capability selected by a bound method.
 *
 * `receiver` is the exact read target, `mutable` controls how a bare sibling
 * method is rebound, and `copyOnWrite` records the aggregate graph isolated for
 * an outer functional update. The private symbol is present only when this
 * invocation may write its receiver.
 */
export type ReceiverState = {
  readonly receiver: Frame;
  readonly mutable: boolean;
  readonly copyOnWrite?: WeakSet<Frame>;
  readonly [RECEIVER_WRITE_AUTHORIZED]?: true;
};

const receiverState = (
  receiver: Frame,
  mutable: boolean,
  copyOnWrite: WeakSet<Frame> | undefined,
  writeAuthorized: boolean,
): ReceiverState => {
  const state: ReceiverState = writeAuthorized
    ? {
      receiver,
      mutable,
      copyOnWrite,
      [RECEIVER_WRITE_AUTHORIZED]: true,
    }
    : { receiver, mutable, copyOnWrite };
  return Object.freeze(state);
};

/** Extracts the receiver only from write authority minted in this module. */
export const authorizedReceiverWriteTarget = (
  state: unknown,
): Frame | undefined => {
  if (typeof state !== "object" || state === null) return undefined;
  const candidate = state as ReceiverState;
  return candidate[RECEIVER_WRITE_AUTHORIZED] === true &&
      candidate.receiver instanceof Frame
    ? candidate.receiver
    : undefined;
};

/** The suffix that marks a method as mutating its receiver. */
const MUTATING_SUFFIX = ":";

/**
 * A method paired with the receiver it runs against.
 *
 * Binding a method to a receiver is a statement about the receiver role, not
 * about handles; a handle is merely where the binding is discovered. The
 * receiver travels to the body as an explicit argument, so the shared closure
 * is neither copied nor mutated and stays reusable across calls.
 *
 * Two rules follow from the method's declared effect and the handle's declared
 * mutability:
 *
 * - A mutating method reached through a mutable handle acts on the receiver
 *   itself, and the call evaluates to that receiver.
 * - A mutating method reached through an immutable handle is a functional
 *   update: it acts on an instance copy, leaving the original untouched at any
 *   depth, and the call evaluates to the new value.
 *
 * A non-mutating method evaluates to whatever its body produced.
 */
export class BoundMethod extends Frame {
  constructor(
    private readonly method: FrameLazy,
    private readonly receiverTarget: Frame,
    private readonly mutable: boolean,
    private readonly key: string,
    private readonly copyOnWrite?: WeakSet<Frame>,
  ) {
    super();
  }

  /** Whether this method was declared to mutate the frame it runs against. */
  public isMutating(): boolean {
    return this.key.endsWith(MUTATING_SUFFIX);
  }

  public override call(argument: Frame, _parameter = Frame.nil): Frame {
    const state = this.receiverStateForCall();
    if (state instanceof Frame) return state;
    // The parameter slot stays the nil placeholder of an ordinary closure call.
    // Passing the method here would put the shared body ahead of the receiver in
    // the lookup order, and a shared body's captured scope is whichever instance
    // was built last, so a method would read another instance's fields.
    const result = this.method.call(argument, Frame.nil, state);
    if (result.isFailedResult()) return result;
    return this.isMutating() ? state.receiver : result;
  }

  /** Selects one typed receiver capability or refuses a shared-state write. */
  private receiverStateForCall(): ReceiverState | Frame {
    if (!this.isMutating()) {
      // A non-mutating method may read the receiver, but a bare sibling mutator
      // must remain functional even when this method was reached mutably.
      return receiverState(this.receiverTarget, false, this.copyOnWrite, false);
    }
    if (this.mutable) {
      if (
        this.copyOnWrite && !this.copyOnWrite.has(this.receiverTarget)
      ) {
        const key = this.key.slice(0, -MUTATING_SUFFIX.length);
        return Frame.error(`$!.copy-on-write-boundary .${key}`);
      }
      return receiverState(
        this.receiverTarget,
        true,
        this.copyOnWrite,
        true,
      );
    }

    const copied = new Map<Frame, Frame>();
    const target = this.receiverTarget.instanceCopy(copied);
    const copyOnWrite = this.copyOnWrite ?? new WeakSet<Frame>();
    for (const aggregate of copied.values()) {
      copyOnWrite.add(aggregate);
    }
    return receiverState(target, true, copyOnWrite, true);
  }
}
