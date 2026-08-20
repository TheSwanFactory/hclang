import { Frame } from "../frames/frame.ts";
import type { ReceiverState } from "../frames/bound-method.ts";

/**
 * Converts a source Frame and block into a result, optionally preserving the
 * active receiver capability across a built-in control-flow callback.
 */
export type ICurryFunction = (
  source: Frame,
  block: Frame,
  receiverState?: ReceiverState,
) => Frame;

/** A curried built-in operation bound to its source Frame. */
export class FrameCurry extends Frame {
  private callbackReceiverState?: ReceiverState;

  constructor(
    protected Func: ICurryFunction,
    protected Source: Frame,
    protected key: string,
  ) {
    super();
    this.id += "." + key;
  }

  /** Captures method state on this fresh operation lookup for its callbacks. */
  public withReceiverState(receiverState: ReceiverState): this {
    this.callbackReceiverState = receiverState;
    return this;
  }

  /** Invokes the curried operation and forwards only its captured method state. */
  public override call(
    argument: Frame,
    _parameter: Frame = Frame.nil,
    _receiverState?: ReceiverState,
  ): Frame {
    return this.Func(this.Source, argument, this.callbackReceiverState);
  }

  public override toString(): string {
    return this.id; // `FrameCurry(${this.Source.id}, ${this.Func})`;
  }
}
