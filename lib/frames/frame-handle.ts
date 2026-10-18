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
 * - **Transparency.** Wrapping must not change what a value prints, equals,
 *   exposes, or answers when applied, so rendering, data, metadata, array
 *   views, and application all delegate to the target. A handle is invisible to
 *   comparison, and assignment unwraps it, so a mutation lands on the same
 *   frame it would have without the wrapper.
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
    private target: Frame,
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

  /** What this handle was read from during a functional update (#401). */
  private holder?: Frame;

  public unwrap(): Frame {
    return this.target;
  }

  /**
   * Records what this handle was read from, so a write through it during a
   * functional update can copy the path down to its target.
   */
  public heldBy(holder: Frame): this {
    this.holder = holder;
    return this;
  }

  /**
   * The target a write through this handle may land on during a functional
   * update, copied into the copy-on-write graph first (#401).
   *
   * A functional update copies only its receiver. When a write is about to
   * reach a member the call has not copied yet, that member is copied now and
   * installed in the copy that holds it, copying that holder first if it too
   * is still shared, and this handle follows the copy. A target reached
   * through a shared declared parent has no copied holder, so it answers
   * nothing and the write meets `$!.copy-on-write-boundary`.
   */
  public copyOnWriteTarget(): Frame | undefined {
    const graph = this.copyOnWrite;
    if (!graph || graph.has(this.target)) return this.target;

    const holder = this.holder instanceof FrameHandle
      ? this.holder.copyOnWriteTarget()
      : this.holder;
    if (!holder || !graph.has(holder)) return undefined;

    const copy = this.target.instanceCopy();
    if (!holder.replaceMember(this.target, copy)) return undefined;
    graph.add(copy);
    this.target = copy;
    return copy;
  }

  /** A handle is transparent to equality: it compares as its target. */
  public override referent(): Frame {
    return this.target.referent();
  }

  public override equals(other: Frame): Frame {
    return this.target.equals(other);
  }

  public override typeEquals(other: Frame): Frame {
    return this.target.typeEquals(other);
  }

  /** Whether the name that produced this handle carried the effect marker. */
  public isMutable(): boolean {
    return this.mutable;
  }

  /** Retains this live reference while withholding its write capability. */
  public withoutWriteAuthority(): FrameHandle {
    return this.mutable
      ? new FrameHandle(
        this.target,
        false,
        this.copyOnWrite,
        this.readContext,
        this.searchReadContext,
      )
      : this;
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
      const effect = methodEffect(key);
      if (effect.mutating && this.mutable) this.copyOnWriteTarget();
      return new BoundMethod(
        value,
        this.target,
        this.mutable,
        effect,
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

  /** Transparency covers application: a named aggregate collects like its literal. */
  public override collects(): boolean {
    return this.target.collects();
  }

  /**
   * Applying through a name answers what applying the value would, without
   * writing through the name. A collect lands on a fresh aggregate, so `xs 3`
   * answers a new array and `xs` is unchanged, whether or not the name is
   * mutable: a write goes through a mutating method or `@`, never a collect.
   * An aggregate that declares its own application (#375) is the exception
   * by declaration: its `apply_` method writes like any mutating method.
   */
  public override apply(argument: Frame, parameter: Frame): Frame {
    const declared = this.target.applicationMethod();
    if (!declared) {
      return this.target.collectingCopy().apply(argument, parameter);
    }
    // A declared application is a method, so this name's mutability decides
    // whether it writes the target or answers an updated copy, and a nil
    // answer leaves the accumulator as it was (`FrameArray.applyDeclared`).
    const result = new BoundMethod(
      declared.method as FrameLazy,
      this.target,
      this.mutable,
      methodEffect(declared.key),
      this.copyOnWrite,
      this.readContext,
    ).call(argument, parameter);
    return result.is.void ? this : result;
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

  public override elements(): Frame[] {
    return this.target.elements();
  }

  public override visibleKeys(): string[] {
    return this.target.visibleKeys();
  }
}
