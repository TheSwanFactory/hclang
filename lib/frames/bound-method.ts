import { Frame } from "./frame.ts";
import type { FrameLazy } from "./frame-lazy.ts";

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
    const authorized = this.authorizedCall();
    // The parameter slot stays the nil placeholder of an ordinary closure call.
    // Passing the method here would put the shared body ahead of the receiver in
    // the lookup order, and a shared body's captured scope is whichever instance
    // was built last, so a method would read another instance's fields.
    const result = this.method.call(
      argument,
      Frame.nil,
      authorized.target,
      authorized.copyOnWrite,
    );
    if (result.is.error) return result;
    return this.isMutating() ? authorized.target : result;
  }

  /** Selects the target and records every aggregate isolated for this call. */
  private authorizedCall(): {
    target: Frame;
    copyOnWrite?: WeakSet<Frame>;
  } {
    if (!this.isMutating() || this.mutable) {
      return {
        target: this.receiverTarget,
        copyOnWrite: this.copyOnWrite,
      };
    }

    const copied = new Map<Frame, Frame>();
    const target = this.receiverTarget.instanceCopy(copied);
    const copyOnWrite = this.copyOnWrite ?? new WeakSet<Frame>();
    for (const aggregate of copied.values()) {
      copyOnWrite.add(aggregate);
    }
    return { target, copyOnWrite };
  }
}
