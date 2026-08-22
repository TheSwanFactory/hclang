import { type EvaluationRoots, Frame } from "./frame.ts";
import { FrameLazy } from "./frame-lazy.ts";
import { BoundMethod } from "./bound-method.ts";
import { methodEffect } from "./effect-marker.ts";
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
 * - **Caller-scoped lookup.** A handle created by symbol lookup carries that
 *   read's lexical context separately from the shared target. Local and
 *   declared-parent lookup remains live on the target, then falls back through
 *   the per-read context without rewriting `target.up`. Legacy programmatic
 *   handles without a read context retain their original target traversal.
 *
 * Discovering a method here yields a `BoundMethod`; the effect rules for that
 * pairing belong to it, not to the handle.
 */
export class FrameHandle extends Frame {
  constructor(
    private readonly target: Frame,
    private readonly mutable: boolean,
    private readonly copyOnWrite?: WeakSet<Frame>,
    private readonly readContext?: Frame,
    private readonly searchReadContext = true,
  ) {
    super();
    // Preserve the historical programmatic link. Contextual lookup overrides
    // traversal below, so a shared target never needs to acquire this context.
    this.up = target;
  }

  public unwrap(): Frame {
    return this.target;
  }

  /** The lexical fallback selected for this particular read. */
  public readContextFrame(): Frame | undefined {
    return this.readContext;
  }

  public override evaluationRoots(): EvaluationRoots | undefined {
    return this.readContext?.evaluationRoots();
  }

  /**
   * Context to persist on a value returned through this handle.
   *
   * A receiver-only handle restricts one lookup operation; that restriction
   * must not truncate the caller-specific continuation of a returned value.
   */
  public resultContext(): FrameHandle {
    return this.searchReadContext ? this : new FrameHandle(
      this.target,
      this.mutable,
      this.copyOnWrite,
      this.readContext,
    );
  }

  /** Copy provenance carried across dotted aggregate traversal. */
  public copyOnWriteScope(): WeakSet<Frame> | undefined {
    return this.copyOnWrite;
  }

  /** Resolve target-local array and metadata values without following target.up. */
  protected override lookup_here(key: string, origin: MetaFrame): Frame {
    return this.readContext
      ? this.lookup_here_on(this.target, key, origin)
      : super.lookup_here(key, origin);
  }

  protected override lookup_links(): Frame[] {
    if (!this.readContext) return [this.target];

    const links: Frame[] = [];
    if (this.target.hasDeclaredParent()) links.push(this.target.parent);
    if (
      this.searchReadContext && this.readContext !== this.target &&
      !links.includes(this.readContext)
    ) {
      links.push(this.readContext);
    }
    return links;
  }

  protected override lookup_result(value: Frame, key: string): Frame {
    if (value instanceof FrameLazy) {
      return new BoundMethod(
        value,
        this.target,
        this.mutable,
        methodEffect(key),
        this.copyOnWrite,
        this.readContext,
      );
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
