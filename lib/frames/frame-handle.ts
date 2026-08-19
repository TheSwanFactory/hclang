import { Frame } from "./frame.ts";
import { FrameLazy } from "./frame-lazy.ts";
import type { MetaFrame } from "./meta-frame.ts";
import type { Context } from "./context.ts";

/** A name's effect-qualified reference to a value. */
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

class BoundMethod extends Frame {
  constructor(
    private readonly method: FrameLazy,
    private readonly boundReceiver: Frame,
    private readonly mutable: boolean,
    private readonly key: string,
  ) {
    super();
  }

  public override call(argument: Frame, _parameter = Frame.nil): Frame {
    // Copy-on-write is the one caller of the instance copy, and it means
    // functional update: an immutable receiver is untouched at any depth, and
    // the call evaluates to the new value.
    const target = this.key.endsWith(":") && !this.mutable
      ? this.boundReceiver.instanceCopy()
      : this.boundReceiver;
    // The receiver travels as an explicit argument. The shared closure is
    // neither copied nor mutated, so it stays reusable across calls.
    const result = this.method.call(argument, this.method, target);
    if (result.is.error) return result;
    return this.key.endsWith(":") ? target : result;
  }
}
