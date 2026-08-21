import { Frame } from "./frame.ts";
import { FrameHandle } from "./frame-handle.ts";
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
  enclosing?: EvaluationScope;
  closure?: Frame;
  lexicalTarget: Frame;
};

/** An ordered lookup list paired with its membership set. */
type LookupLayers = {
  frames: Frame[];
  members: Set<Frame>;
};

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

  readonly #lookupFrames: Frame[];
  readonly #lookupMembers: Set<Frame>;

  private constructor(options: ScopeOptions) {
    this.argument = options.argument;
    this.parameter = options.parameter;
    this.receiverState = options.receiverState;
    this.writeTarget = options.writeTarget;
    this.writeTargetRole = options.writeTargetRole;
    this.enclosing = options.enclosing;
    this.closure = options.closure;
    this.lexicalTarget = options.lexicalTarget;
    this.#lookupFrames = options.lookupFrames;
    this.#lookupMembers = options.lookupMembers;
  }

  /** Creates the scope at the evaluator boundary. */
  public static root(out: Frame, context: Frame = Frame.nil): EvaluationScope {
    const layers = EvaluationScope.layers(
      context.is.void ? [out] : [out, context],
    );
    return new EvaluationScope({
      argument: out,
      parameter: context.is.void ? undefined : context,
      writeTarget: out,
      writeTargetRole: "statement",
      lookupFrames: layers.frames,
      lookupMembers: layers.members,
      lexicalTarget: out,
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
   * A handle argument is the one exception, because a handle is explicitly a
   * mutable view requested by the caller for exactly this purpose.
   */
  public static call(
    argument: Frame,
    parameter: Frame = Frame.nil,
    closure?: Frame,
    enclosing?: EvaluationScope,
    receiverState?: ReceiverState,
  ): EvaluationScope {
    const local = new Frame();
    const target = argument instanceof FrameHandle ? argument.unwrap() : local;
    const targetRole: WriteTargetRole = argument instanceof FrameHandle
      ? "handle"
      : "statement";

    const lookupFrames = [local, argument];
    if (!parameter.is.void) lookupFrames.push(parameter);
    if (receiverState) lookupFrames.push(receiverState.receiver);
    if (closure) lookupFrames.push(closure);
    if (enclosing) lookupFrames.push(...enclosing.lookupFrames());
    const layers = EvaluationScope.layers(lookupFrames);

    return new EvaluationScope({
      argument,
      parameter: parameter.is.void ? undefined : parameter,
      receiverState,
      writeTarget: target,
      writeTargetRole: targetRole,
      lookupFrames: layers.frames,
      lookupMembers: layers.members,
      enclosing,
      closure,
      lexicalTarget: target,
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
      enclosing: this.enclosing,
      closure: this.closure,
      lexicalTarget: this.lexicalTarget,
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
      enclosing: this.enclosing,
      closure: this.closure,
      lexicalTarget: target,
    });
  }

  /** Ordered lookup layers for symbol and alias resolution. */
  public lookupFrames(): readonly Frame[] {
    return this.#lookupFrames;
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
