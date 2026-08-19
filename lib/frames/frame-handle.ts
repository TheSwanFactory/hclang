import { Frame } from "./frame.ts";
import { FrameLazy } from "./frame-lazy.ts";
import { BoundMethod } from "./bound-method.ts";
import type { MetaFrame } from "./meta-frame.ts";
import type { Context } from "./context.ts";

/**
 * A name's effect-qualified reference to a value.
 *
 * The handle's charter is that reference and nothing more. Two rules define it:
 *
 * - **Transparency.** Wrapping must not change what a value prints, equals, or
 *   exposes, so rendering, data, metadata, and array views all delegate to the
 *   target. A handle is invisible to comparison, and assignment unwraps it, so
 *   a mutation lands on the same frame it would have without the wrapper.
 * - **Caller-scoped lookup.** `get_here` answers missing by design. Explicit
 *   dotted lookup therefore resolves against the caller's origin rather than
 *   this wrapper, which is what keeps visibility grading pinned to the frame
 *   that asked.
 *
 * Discovering a method here yields a `BoundMethod`; the effect rules for that
 * pairing belong to it, not to the handle.
 */
export class FrameHandle extends Frame {
  constructor(
    private readonly target: Frame,
    private readonly mutable: boolean,
  ) {
    super();
    this.up = target;
  }

  public unwrap(): Frame {
    return this.target;
  }

  public override get(key: string, origin: MetaFrame = this): Frame {
    const value = this.target.get(key, origin);
    if (value instanceof FrameLazy) {
      return new BoundMethod(value, this.target, this.mutable, key);
    }
    return value;
  }

  /** Keeps explicit dotted lookup tied to the caller, not this wrapper. */
  public override get_here(_key: string, _origin: MetaFrame = this): Frame {
    return Frame.missing;
  }

  public override called_by(context: Frame, parameter: Frame): Frame {
    return context.apply(this.target, parameter);
  }

  public override toString(): string {
    return this.target.toString();
  }

  public override dataString(): string {
    return this.target.dataString();
  }

  public override metadataView(): Context {
    return this.target.metadataView();
  }

  public override asArray(): Frame[] {
    return this.target.asArray();
  }
}
