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
  enclosing?: EvaluationScope;
  closure?: Frame;
  lexicalTarget: Frame;
  legacyLevels?: Frame[];
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
  readonly #legacyLevels?: Frame[];

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
    this.#legacyLevels = options.legacyLevels;
  }

  /** Creates the scope at the evaluator boundary. */
  public static root(out: Frame, context: Frame = Frame.nil): EvaluationScope {
    return new EvaluationScope({
      argument: out,
      parameter: context.is.void ? undefined : context,
      writeTarget: out,
      writeTargetRole: "statement",
      lookupFrames: context.is.void ? [out] : [out, context],
      lexicalTarget: out,
    });
  }

  /**
   * Normalizes historical Frame[] callers once at the protocol boundary.
   * Positional interpretation remains only in this adapter, not in evaluation.
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

    return new EvaluationScope({
      argument,
      parameter,
      receiverState,
      writeTarget: binding.target,
      writeTargetRole: binding.role,
      lookupFrames: frames.length > 0 ? frames : [Frame.nil],
      lexicalTarget: binding.target,
      legacyLevels: frames,
    });
  }

  /** Creates named call state and a local target for empty arguments. */
  public static call(
    argument: Frame,
    parameter: Frame = Frame.nil,
    closure?: Frame,
    enclosing?: EvaluationScope,
    receiverState?: ReceiverState,
  ): EvaluationScope {
    const local = new Frame();
    const target = argument instanceof FrameHandle
      ? argument.unwrap()
      : argument.is.void
      ? local
      : argument;
    const targetRole: WriteTargetRole = argument instanceof FrameHandle
      ? "handle"
      : "statement";

    const lookupFrames = [local, argument];
    if (!parameter.is.void) lookupFrames.push(parameter);
    if (receiverState) lookupFrames.push(receiverState.receiver);
    if (closure) lookupFrames.push(closure);
    if (enclosing) lookupFrames.push(...enclosing.lookupFrames());

    return new EvaluationScope({
      argument,
      parameter: parameter.is.void ? undefined : parameter,
      receiverState,
      writeTarget: target,
      writeTargetRole: targetRole,
      lookupFrames: EvaluationScope.unique(lookupFrames),
      enclosing,
      closure,
      lexicalTarget: target,
    });
  }

  /** Adds syntax or metadata to lookup without changing any named role. */
  public withLayer(frame: Frame): EvaluationScope {
    return new EvaluationScope({
      argument: this.argument,
      parameter: this.parameter,
      receiverState: this.receiverState,
      writeTarget: this.writeTarget,
      writeTargetRole: this.writeTargetRole,
      lookupFrames: EvaluationScope.unique([...this.#lookupFrames, frame]),
      enclosing: this.enclosing,
      closure: this.closure,
      lexicalTarget: this.lexicalTarget,
      legacyLevels: this.#legacyLevels,
    });
  }

  /** Selects a declaration target explicitly instead of scanning syntax. */
  public withWriteTarget(
    target: Frame,
    role: WriteTargetRole = "construction",
  ): EvaluationScope {
    return new EvaluationScope({
      argument: this.argument,
      parameter: this.parameter,
      receiverState: this.receiverState,
      writeTarget: target,
      writeTargetRole: role,
      lookupFrames: EvaluationScope.unique([...this.#lookupFrames, target]),
      enclosing: this.enclosing,
      closure: this.closure,
      lexicalTarget: target,
      legacyLevels: this.#legacyLevels,
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

  /** Resolves an explicit parameter, then `_^`, `_^^`, ... lexical scopes. */
  public parameterAt(level: number): Frame | undefined {
    const legacy = this.#legacyLevels?.[level];
    if (legacy && legacy !== Frame.nil) return legacy;
    if (level === 1 && this.parameter) return this.parameter;

    let scope = this.enclosing;
    for (let current = 1; current < level; current += 1) {
      scope = scope?.enclosing;
    }
    return scope?.lexicalTarget;
  }

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

  private static unique(frames: Frame[]): Frame[] {
    return frames.filter((frame, index) => frames.indexOf(frame) === index);
  }
}
