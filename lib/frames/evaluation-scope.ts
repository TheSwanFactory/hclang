import { type EvaluationRoots, Frame } from "./frame.ts";
import type { FrameArray } from "./frame-array.ts";
import { FrameHandle } from "./frame-handle.ts";
import { type BindingResolution, type MetaFrame } from "./meta-frame.ts";
import type { ReceiverState } from "./bound-method.ts";

/** Why the current evaluation scope selected its declaration target. */
export type WriteTargetRole = "construction" | "handle" | "statement";

/**
 * Compatibility input for the public Frame protocol.
 *
 * Production evaluation constructs EvaluationScope values directly. Frame[] is
 * accepted at the boundary for callers of the historical API and is normalized
 * immediately, so runtime evaluation never has to interpret positional slots.
 */
export type EvaluationInput = EvaluationScope | Frame[];

type ScopeOptions = {
  argument: Frame;
  parameter?: Frame;
  receiverState?: ReceiverState;
  writeTarget: Frame;
  writeTargetRole: WriteTargetRole;
  lookupFrames: Frame[];
  lookupMembers: Set<Frame>;
  argumentLayer?: Frame;
  enclosing?: EvaluationScope;
  closure?: Frame;
  lexicalTarget: Frame;
  fileScope: Frame;
  hostNamespace: Frame;
};

/** An ordered lookup list paired with its membership set. */
type LookupLayers = {
  frames: Frame[];
  members: Set<Frame>;
};

/** Live, read-only lookup through an ordered set of existing frame identities. */
class LiveLookupContext extends Frame {
  readonly #lookupFrames: readonly Frame[];
  readonly #identityHandles = new WeakMap<Frame, FrameHandle>();

  public constructor(
    frames: readonly Frame[],
    private readonly continuation: Frame,
  ) {
    super();
    this.#lookupFrames = frames.map((frame) =>
      frame instanceof FrameHandle ? frame.withoutWriteAuthority() : frame
    );
  }

  public override resolve_here(
    key: string,
    _origin: MetaFrame = this,
  ): BindingResolution | undefined {
    for (const context of this.#lookupFrames) {
      // The same non-global graph as `lookup_here`, so a value and its binding
      // agree; the outer resolve keeps the single global tier.
      const binding = this.resolve_graph_on(context, key, context);
      if (binding) return binding;
    }
    return undefined;
  }

  protected override lookup_here(key: string, _origin: MetaFrame): Frame {
    for (const context of this.#lookupFrames) {
      // Non-global graph only: an operator falls through to the outer lookup's
      // global tier, which curries it with that lookup's own operand.
      const value = this.lookup_graph_on(context, key, context);
      if (value.is.missing) continue;
      if (value instanceof FrameHandle) {
        return value.withoutWriteAuthority();
      }
      if (!value.ownsIdentity()) return value;

      const existing = this.#identityHandles.get(value);
      if (existing) return existing;
      const projected = new FrameHandle(
        value,
        false,
        undefined,
        this.continuation,
      );
      this.#identityHandles.set(value, projected);
      return projected;
    }
    return Frame.missing;
  }
}

/**
 * Named, immutable state for one evaluation.
 *
 * Syntax can derive a scope with another lookup layer or declaration target,
 * while closure calls derive a new scope linked to the scope captured when the
 * closure literal was evaluated. No caller mutates a shared context stack.
 */
export class EvaluationScope {
  public readonly argument: Frame;
  public readonly parameter?: Frame;
  public readonly receiverState?: ReceiverState;
  public readonly writeTarget: Frame;
  public readonly writeTargetRole: WriteTargetRole;
  public readonly enclosing?: EvaluationScope;
  public readonly closure?: Frame;
  public readonly lexicalTarget: Frame;
  public readonly fileScope: Frame;
  public readonly hostNamespace: Frame;

  readonly #lookupFrames: Frame[];
  readonly #lookupMembers: Set<Frame>;
  readonly #argumentLayer?: Frame;

  private constructor(options: ScopeOptions) {
    this.argument = options.argument;
    this.parameter = options.parameter;
    this.receiverState = options.receiverState;
    this.writeTarget = options.writeTarget;
    this.writeTargetRole = options.writeTargetRole;
    this.enclosing = options.enclosing;
    this.closure = options.closure;
    this.lexicalTarget = options.lexicalTarget;
    this.fileScope = options.fileScope;
    this.hostNamespace = options.hostNamespace;
    this.#lookupFrames = options.lookupFrames;
    this.#lookupMembers = options.lookupMembers;
    this.#argumentLayer = options.argumentLayer;
  }

  /** Creates the scope at the evaluator boundary. */
  public static root(
    fileScope: Frame,
    hostNamespace: Frame = Frame.nil,
  ): EvaluationScope {
    const layers = EvaluationScope.layers([fileScope]);
    return new EvaluationScope({
      argument: fileScope,
      writeTarget: fileScope,
      writeTargetRole: "statement",
      lookupFrames: layers.frames,
      lookupMembers: layers.members,
      lexicalTarget: fileScope,
      fileScope,
      hostNamespace,
    });
  }

  /** Creates target-local lookup while retaining both named roots. */
  public static anchor(
    reference: Frame,
    fileScope: Frame,
    hostNamespace: Frame,
  ): EvaluationScope {
    const layers = EvaluationScope.layers([reference]);
    return new EvaluationScope({
      argument: reference,
      writeTarget: fileScope,
      writeTargetRole: "statement",
      lookupFrames: layers.frames,
      lookupMembers: layers.members,
      lexicalTarget: fileScope,
      fileScope,
      hostNamespace,
    });
  }

  /**
   * Normalizes historical Frame[] callers once at the protocol boundary.
   *
   * Positional interpretation remains only in this adapter, and only for the
   * two slots that have named meanings: the argument and the parameter. Deeper
   * indices carry no meaning, because `_^^` and beyond name enclosing lexical
   * scopes, which a flat array cannot express.
   */
  public static from(input: EvaluationInput = []): EvaluationScope {
    if (input instanceof EvaluationScope) return input;

    const frames = [...input];
    const argument = frames[0] ?? Frame.nil;
    const parameter = frames.length > 1 && frames[1] !== Frame.nil
      ? frames[1]
      : undefined;
    const receiverState = EvaluationScope.findReceiverState(frames);
    const binding = EvaluationScope.findWriteTarget(frames, argument);
    const roots = EvaluationScope.findEvaluationRoots(frames);
    const layers = EvaluationScope.layers(
      frames.length > 0 ? frames : [Frame.nil],
    );

    return new EvaluationScope({
      argument,
      parameter,
      receiverState,
      writeTarget: binding.target,
      writeTargetRole: binding.role,
      lookupFrames: layers.frames,
      lookupMembers: layers.members,
      lexicalTarget: binding.target,
      fileScope: roots?.fileScope ?? binding.target,
      hostNamespace: roots?.hostNamespace ?? Frame.nil,
    });
  }

  /**
   * Creates named call state with the call's own frame as its write target.
   *
   * A closure declares into its own local frame, never into the argument it was
   * handed: the argument is read-only for the duration of the call. That makes
   * `.x _` mean "bind the argument under the name x here" rather than "set x on
   * the argument to the argument", which is what made a closure's write target
   * and its argument the same frame and produced a self-referential binding.
   *
   * A mutable handle argument is the one exception, because the caller asked
   * for a mutable view by spelling the name with the effect marker (`x_`). A
   * plain name also arrives as a handle, but an immutable one, and it grants no
   * write: `f x` must not change `x`.
   */
  public static call(
    argument: Frame,
    parameter: Frame = Frame.nil,
    closure?: Frame,
    enclosing?: EvaluationScope,
    receiverState?: ReceiverState,
  ): EvaluationScope {
    const local = new Frame();
    const writable = argument instanceof FrameHandle && argument.isMutable();
    const target = writable ? argument.unwrap() : local;
    const targetRole: WriteTargetRole = writable ? "handle" : "statement";

    const lookupFrames = [local, argument];
    if (!parameter.is.void) lookupFrames.push(parameter);
    // A block nested in a method runs with the receiver state its method
    // forwarded, and the enclosing method scope already holds the receiver
    // layers behind the method's own locals. Pushing them again here would put
    // the scope the receiver was read from ahead of those locals, so a caller
    // that binds a local's name would capture it (#382 H11).
    const forwarded = receiverState !== undefined &&
      receiverState === enclosing?.receiverState;
    if (receiverState && !forwarded) {
      const receiverLookup = receiverState.lexicalContext
        ? new FrameHandle(
          receiverState.receiver,
          receiverState.mutable,
          receiverState.copyOnWrite,
          receiverState.lexicalContext,
          false,
        )
        : receiverState.receiver;
      lookupFrames.push(receiverLookup);
      if (receiverState.lexicalContext) {
        lookupFrames.push(receiverState.lexicalContext);
      }
    }
    if (closure) lookupFrames.push(closure);
    if (enclosing) lookupFrames.push(...enclosing.lookupFrames());
    const layers = EvaluationScope.layers(lookupFrames);
    const carriedRoots = EvaluationScope.findEvaluationRoots([
      receiverState?.lexicalContext,
      argument,
      parameter,
    ]);

    return new EvaluationScope({
      argument,
      parameter: parameter.is.void ? undefined : parameter,
      receiverState,
      writeTarget: target,
      writeTargetRole: targetRole,
      lookupFrames: layers.frames,
      lookupMembers: layers.members,
      argumentLayer: argument,
      enclosing,
      closure,
      lexicalTarget: target,
      fileScope: enclosing?.fileScope ?? carriedRoots?.fileScope ?? target,
      hostNamespace: enclosing?.hostNamespace ??
        carriedRoots?.hostNamespace ?? Frame.nil,
    });
  }

  /**
   * Creates a fresh named namespace with live lookup into this scope.
   *
   * Imported declarations stop at the namespace, while lookup retains exact
   * references to the caller's existing layers. Call-only parameter and
   * receiver authority are deliberately not inherited.
   */
  public namedChild(namespace: FrameArray): EvaluationScope {
    namespace.up = new LiveLookupContext(this.#lookupFrames, namespace);
    const layers = EvaluationScope.layers([namespace]);
    return new EvaluationScope({
      argument: namespace,
      writeTarget: namespace,
      writeTargetRole: "statement",
      lookupFrames: layers.frames,
      lookupMembers: layers.members,
      enclosing: this,
      lexicalTarget: namespace,
      fileScope: namespace,
      hostNamespace: this.hostNamespace,
    });
  }

  /**
   * Adds syntax or metadata to lookup without changing any named role.
   *
   * A layer already in lookup would be deduplicated away, so this scope is
   * returned unchanged rather than rebuilt.
   */
  public withLayer(frame: Frame): EvaluationScope {
    if (this.#lookupMembers.has(frame)) return this;

    const layers = this.appended(frame);
    return new EvaluationScope({
      argument: this.argument,
      parameter: this.parameter,
      receiverState: this.receiverState,
      writeTarget: this.writeTarget,
      writeTargetRole: this.writeTargetRole,
      lookupFrames: layers.frames,
      lookupMembers: layers.members,
      argumentLayer: this.#argumentLayer,
      enclosing: this.enclosing,
      closure: this.closure,
      lexicalTarget: this.lexicalTarget,
      fileScope: this.fileScope,
      hostNamespace: this.hostNamespace,
    });
  }

  /** Selects a declaration target explicitly instead of scanning syntax. */
  public withWriteTarget(
    target: Frame,
    role: WriteTargetRole = "construction",
  ): EvaluationScope {
    const layers = this.appended(target);
    return new EvaluationScope({
      argument: this.argument,
      parameter: this.parameter,
      receiverState: this.receiverState,
      writeTarget: target,
      writeTargetRole: role,
      lookupFrames: layers.frames,
      lookupMembers: layers.members,
      argumentLayer: this.#argumentLayer,
      enclosing: this.enclosing,
      closure: this.closure,
      lexicalTarget: target,
      fileScope: this.fileScope,
      hostNamespace: this.hostNamespace,
    });
  }

  /** Accessor whose identity grades private and protected reads. */
  public accessOrigin(): Frame {
    return this.receiverState?.receiver ?? this.writeTarget;
  }

  /** Scope used when a projected unbound closure captures its environment. */
  public captureScope(): EvaluationScope {
    const roots = this.argument.evaluationRoots();
    return roots
      ? EvaluationScope.root(roots.fileScope, roots.hostNamespace)
      : this;
  }

  /** Ordered lookup layers for symbol and alias resolution. */
  public lookupFrames(): readonly Frame[] {
    return this.#lookupFrames;
  }

  /**
   * Whether `layer` is this call's explicit argument, which lookup reads for
   * its own and inherited properties only (spec 7, layer 2), never through the
   * scope that built it.
   */
  public isArgumentLayer(layer: Frame): boolean {
    return layer === this.#argumentLayer;
  }

  /** Resolves `_`, `__`, ... through enclosing call scopes. */
  public argumentAt(level: number): Frame | undefined {
    if (level <= 1) return this.argument;

    let scope = this.enclosing;
    for (let current = 2; current < level; current += 1) {
      scope = scope?.enclosing;
    }
    return scope?.argument;
  }

  /** Resolves `.`, `..`, ... through exact enclosing call parameters. */
  public parameterAt(level: number): Frame | undefined {
    if (level <= 1) return this.parameter;

    let scope = this.enclosing;
    for (let current = 2; current < level; current += 1) {
      scope = scope?.enclosing;
    }
    return scope?.parameter;
  }

  /**
   * Resolves one enclosing lexical declaration target per level.
   *
   * This is the only meaning of the accessor: the explicit parameter is read
   * from `parameter` by the callers that want it, so one spelling asking for
   * two different things stays visible at the call site.
   */
  public lexicalAt(level: number): Frame | undefined {
    if (level <= 0) return this.lexicalTarget;

    let scope = this.enclosing;
    for (let current = 1; current < level; current += 1) {
      scope = scope?.enclosing;
    }
    return scope?.lexicalTarget;
  }

  /** Copies this scope's lookup layers with additions that are not present. */
  private appended(...additions: Frame[]): LookupLayers {
    const frames = [...this.#lookupFrames];
    const members = new Set(this.#lookupMembers);
    for (const addition of additions) {
      if (members.has(addition)) continue;
      members.add(addition);
      frames.push(addition);
    }
    return { frames, members };
  }

  /** Builds deduplicated lookup layers in one linear pass. */
  /**
   * Find named roots along a value's lexical projection continuation.
   *
   * Handles keep that continuation separate from their identity-bearing target;
   * ordinary plumbing copies carry it in `up`. Structural parents are never
   * searched, and captureScope intentionally retains its direct-root check so a
   * projected object's own metadata remains in lexical lookup.
   */
  private static findEvaluationRoots(
    candidates: readonly (Frame | undefined)[],
  ): EvaluationRoots | undefined {
    for (const candidate of candidates) {
      const seen = new Set<Frame>();
      let current = candidate;
      while (current && !current.is.missing && !seen.has(current)) {
        seen.add(current);
        if (current instanceof FrameHandle) {
          current = current.readContextFrame();
          continue;
        }
        const roots = current.evaluationRoots();
        if (roots) return roots;
        current = current.up;
      }
    }
    return undefined;
  }

  private static layers(candidates: readonly Frame[]): LookupLayers {
    const frames: Frame[] = [];
    const members = new Set<Frame>();
    for (const candidate of candidates) {
      if (members.has(candidate)) continue;
      members.add(candidate);
      frames.push(candidate);
    }
    return { frames, members };
  }

  /**
   * The innermost receiver capability carried by a historical context list.
   *
   * Only a frame's own invocation slot counts. The lexical `up` chain is not
   * followed: it is rewritten by unrelated evaluation, so walking it would let
   * one call's receiver leak into another. Scopes built by `call` carry the
   * state in a named field and never need this scan.
   */
  private static findReceiverState(frames: Frame[]): ReceiverState | undefined {
    for (let index = frames.length - 1; index >= 0; index -= 1) {
      const state = frames[index].receiverState;
      if (state) return state;
    }
    return undefined;
  }

  private static findWriteTarget(
    frames: Frame[],
    fallback: Frame,
  ): { target: Frame; role: WriteTargetRole } {
    for (let index = frames.length - 1; index >= 0; index -= 1) {
      const frame = frames[index];
      if (frame instanceof FrameHandle) {
        return { target: frame.unwrap(), role: "handle" };
      }
      if (frame.declares) {
        return { target: frame, role: "construction" };
      }
    }
    return { target: fallback, role: "statement" };
  }
}
