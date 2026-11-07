import { Frame } from "./frame.ts";
import { FrameType } from "./frame-type.ts";
import {
  atomsOf,
  FrameExpr,
  noteEnclosing,
  sitesAround,
} from "./frame-expr.ts";
import { FrameGroup } from "./frame-group.ts";
import { FrameSymbol } from "./frame-symbol.ts";
import { type Context, NilContext } from "./context.ts";
import type { ReceiverState } from "./bound-method.ts";
import { type EvaluationInput, EvaluationScope } from "./evaluation-scope.ts";
import { renderSourceTerm } from "./frame-list.ts";
import { isFrameMatcher } from "./frame-match.ts";
import type { SigilStart } from "../scan.ts";

// Both maps describe per-evaluation bound copies. The parsed/shared closure is
// never a key, so evaluating one template in two scopes cannot rebind either
// result or mutate the template's lexical ancestry.
const capturedScopes = new WeakMap<FrameLazy, EvaluationScope>();
const inlineCallbackReceiverStates = new WeakMap<FrameLazy, ReceiverState>();

export class FrameLazy extends FrameExpr {
  public override isClosure(): this is FrameLazy {
    return true;
  }

  public static readonly LAZY_BEGIN = "{";
  public static readonly LAZY_END = "}";
  public static readonly SIGIL_STARTS = [
    { key: FrameLazy.LAZY_BEGIN, mode: "push" },
    { key: FrameLazy.LAZY_END, mode: "pop" },
  ] as const satisfies readonly SigilStart[];

  constructor(data: Array<Frame>, meta: Context = NilContext) {
    super(data, meta);
  }

  private signature?: FrameGroup;

  // The optional `^^` output contract, complementary to the `^` input
  // signature above. A declared return schema gates the body's result the way
  // `signature` gates the argument, and nothing else: it is a type assertion
  // on the exposed value, not a freeze, copy, conversion, or callback.
  private returnContract?: Frame;

  /**
   * Reads a resource as an unevaluated closure, bound at `site` (#443). The
   * parser lives in `lib/execute`, which installs this, since this module
   * cannot import it.
   */
  public static quote?: (resource: Frame, site?: EvaluationScope) => Frame;

  public bindSignature(signature: Frame): this {
    if (signature instanceof FrameGroup) {
      this.signature = signature;
    }
    return this;
  }

  /**
   * Records the `^^` return contract. The schema is kept as written and only
   * consulted after the body runs, so copying the closure template, which the
   * per-evaluation `bind` above does, carries the contract to the bound copy.
   */
  public bindReturn(returnContract: Frame): this {
    this.returnContract = returnContract;
    return this;
  }

  /** The declared `^^` output schema, or undefined when none was bound. */
  public returnSchema(): Frame | undefined {
    return this.returnContract;
  }

  /**
   * Checks a completed body result against the declared `^^` contract. An
   * undeclared closure keeps HC's implicit constructive behavior and returns
   * the result unchanged. A result that is already a failure is propagated
   * without a second complaint, since the body never produced a value to
   * expose. Otherwise a non-conforming result is refused as a `$!.type-error`,
   * naming the declared schema and the offending value.
   */
  private checkReturn(result: Frame): Frame {
    const contract = this.returnContract;
    if (!contract) return result;
    if (result.is.error) return result;
    if (isFrameMatcher(contract) && !contract.match(result).matched) {
      return Frame.error(
        `$!.type-error ${contract.toString()} ${result.toString()}`,
      );
    }
    return result;
  }

  public override string_open(): string {
    return FrameLazy.LAZY_BEGIN;
  }

  public override string_close(): string {
    return FrameLazy.LAZY_END;
  }

  public override toStringArray(): string[] {
    // Closures display their body, never the environment they captured.
    const result = this.toStringDataArray();
    if (result.length > 0) {
      const index = result.length - 1;
      const last = result[index];
      if (last.endsWith(",")) {
        result[index] = last.substring(0, last.length - 1);
      }
    }
    return result;
  }

  public override toStringDataArray(): string[] {
    // A body prints as it was written, so it reads back: `;` after a
    // statement, `, ` between terms the source separated, and a tight
    // expression, terms that abut as `o.x` does, in parentheses, since the
    // spacing that bound them cannot be restored (spec a16).
    const parts: string[] = [];
    this.data.forEach((term: Frame, index) => {
      const statement = term.isPlainExpression();
      const text = statement
        ? term.asArray().map(renderSourceTerm).join(" ")
        : renderSourceTerm(term);
      // Only two statements the source separated take a comma; a body built
      // from bare terms, as a test may build one, is one juxtaposition.
      const previous = this.data[index - 1];
      const separated = index > 0 && statement &&
        previous.isPlainExpression() && previous.is.statement !== true;
      parts.push(
        (separated ? ", " : index > 0 ? " " : "") + text +
          (term.is.statement ? ";" : ""),
      );
    });
    const body = parts.join("").trim();
    const display = body.length > 0 ? ` ${body} ` : body;
    return [display + ","];
  }

  /** Binds a reusable closure template to one immutable evaluation scope. */
  public bind(input: EvaluationInput): FrameLazy {
    if (capturedScopes.has(this)) return this;

    const scope = EvaluationScope.from(input);
    if (scope.closure instanceof FrameLazy) noteEnclosing(this, scope.closure);
    const bound = this.copy();
    bound.up = scope.lexicalTarget;
    capturedScopes.set(bound, scope);
    if (scope.receiverState) {
      inlineCallbackReceiverStates.set(bound, scope.receiverState);
    }
    return bound;
  }

  public override in(input: EvaluationInput = []): Frame {
    return this.bind(input);
  }

  /** The scope this bound copy captured; a template no read bound has none. */
  public capturedScope(): EvaluationScope | undefined {
    return capturedScopes.get(this) ?? this.legacyCapture();
  }

  /**
   * The scope a call of this closure would evaluate its body in, built as
   * `call` builds it, without running the body. A static walk of the body
   * resolves names against this scope's lookup frames (`access-footprint.ts`).
   */
  public scopeForCall(
    argument: Frame,
    parameter: Frame = Frame.nil,
    receiverState?: ReceiverState,
  ): EvaluationScope {
    return EvaluationScope.call(
      argument,
      parameter,
      this,
      this.capturedScope(),
      receiverState,
    );
  }

  /** Returns state only when this literal was evaluated in that invocation. */
  public receiverStateForCallback(
    receiverState: ReceiverState,
  ): ReceiverState | undefined {
    return inlineCallbackReceiverStates.get(this) === receiverState
      ? receiverState
      : undefined;
  }

  /**
   * `.#` counts the body's represented words (#429). `.##` sums their native
   * Sizes without execution or evaluation-site registration; an empty body
   * retains Size 1. Residual alternates complete stored-word Sizes; Demi
   * derives from those observations (011.18c). The operator reaches a closure
   * as its argument and is answered before its body runs.
   */
  private sizeOperator(argument: Frame): Frame | undefined {
    if (
      argument instanceof FrameSymbol && argument.is.address === true &&
      Frame.isSizeOperator(argument.spelling())
    ) {
      return this.sizeFor(argument.spelling());
    }
    return undefined;
  }

  /**
   * A closure walks as the atoms of its body, each held with the scope this
   * copy was bound in, so a fold resumes them where the closure would have
   * run (spec a17). A template no evaluation has bound holds none.
   */
  public override elements(): Frame[] {
    return atomsOf(this.data, sitesAround(this.data), capturedScopes.get(this));
  }

  /** Counting needs the atoms only, so it skips the scope wrappers. */
  protected override countedElements(): Frame[] {
    return atomsOf(this.data, sitesAround(this.data));
  }

  /** A closure is one atom of the body that holds it, never unwrapped. */
  public override walked(): Frame {
    return this;
  }

  /** Evaluates this closure with optional bound receiver capability. */
  public override call(
    argument: Frame,
    parameter: Frame = Frame.nil,
    receiverState?: ReceiverState,
  ): Frame {
    const scope = this.prelude(argument, parameter, receiverState);
    if (scope instanceof Frame) return scope;
    const result = FrameExpr.evaluateBody(
      this.data,
      scope,
      this.is.sequence === true,
    );
    return this.checkReturn(result);
  }

  /**
   * `call`, one statement at a time (`FrameExpr.stepBody`). The generator
   * yields after each statement and returns what `call` would have answered.
   * A call that never reaches the body, a size operator, an empty body, or a
   * refused argument, is one step.
   */
  public *steps(
    argument: Frame,
    parameter: Frame = Frame.nil,
    receiverState?: ReceiverState,
  ): Generator<Frame, Frame> {
    const scope = this.prelude(argument, parameter, receiverState);
    if (scope instanceof Frame) {
      yield scope;
      return scope;
    }
    const result = yield* FrameExpr.stepBody(
      this.data,
      scope,
      this.is.sequence === true,
    );
    return this.checkReturn(result);
  }

  /** Everything `call` does before the body: an answer, or the body's scope. */
  private prelude(
    argument: Frame,
    parameter: Frame,
    receiverState?: ReceiverState,
  ): Frame | EvaluationScope {
    if (
      argument instanceof FrameSymbol && argument.is.address === true &&
      argument.spelling() === "<>"
    ) return FrameType.of(this);
    const size = this.sizeOperator(argument);
    if (size) return size;

    if (this.data.length === 0) {
      // Codify the value, not the caller's captured evaluation context.
      const codified = new FrameExpr(argument.asArray(), argument.meta_copy());
      codified.up = this;
      return codified;
    }

    const prepared = this.prepareArgument(argument);
    if (prepared.is.error) return prepared;
    return this.scopeForCall(prepared, parameter, receiverState);
  }

  private legacyCapture(): EvaluationScope | undefined {
    return this.up && !this.up.is.missing
      ? EvaluationScope.root(this.up)
      : undefined;
  }

  private prepareArgument(argument: Frame): Frame {
    if (!this.signature) return argument;

    const prepared = argument.copy();
    for (const [key, defaultValue] of this.signature.meta_pairs()) {
      if (prepared.get_here(key).is.missing) {
        prepared.set(key, defaultValue);
      }
    }

    const missing = this.signature.asArray()
      .filter((item): item is FrameSymbol => item instanceof FrameSymbol)
      .map((item) => item.spelling())
      .filter((key) => prepared.get_here(key).is.missing);
    if (missing.length === 0) return prepared;

    const supplied = argument.meta_pairs().map(([key, value]) =>
      `.${key} ${value.toString()}`
    );
    const required = missing.map((key) =>
      `$!missing-required-argument .${key};`
    );
    return Frame.error(
      `$!invalid-argument-list (${[...supplied, ...required].join(", ")})`,
    );
  }
}
