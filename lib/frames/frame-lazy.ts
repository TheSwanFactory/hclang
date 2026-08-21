import { Frame } from "./frame.ts";
import { FrameExpr } from "./frame-expr.ts";
import { FrameGroup } from "./frame-group.ts";
import { FrameSymbol } from "./frame-symbol.ts";
import { type Context, NilContext } from "./context.ts";
import type { ReceiverState } from "./bound-method.ts";
import { type EvaluationInput, EvaluationScope } from "./evaluation-scope.ts";
import type { SigilStart } from "../scan.ts";

// Both maps describe per-evaluation bound copies. The parsed/shared closure is
// never a key, so evaluating one template in two scopes cannot rebind either
// result or mutate the template's lexical ancestry.
const capturedScopes = new WeakMap<FrameLazy, EvaluationScope>();
const inlineCallbackReceiverStates = new WeakMap<FrameLazy, ReceiverState>();

export class FrameLazy extends FrameExpr {
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

  public bindSignature(signature: Frame): this {
    if (signature instanceof FrameGroup) {
      this.signature = signature;
    }
    return this;
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
    const stringify = (obj: Frame): string => {
      if (obj instanceof FrameExpr) {
        return obj.asArray().map(stringify).join(" ");
      }
      return obj.toString();
    };
    const parts = this.data.map(stringify);
    const body = parts.join(" ").trim();
    const display = body.length > 0 ? ` ${body} ` : body;
    return [display + ","];
  }

  /** Binds a reusable closure template to one immutable evaluation scope. */
  public bind(input: EvaluationInput): FrameLazy {
    if (capturedScopes.has(this)) return this;

    const scope = EvaluationScope.from(input);
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

  /** Returns state only when this literal was evaluated in that invocation. */
  public receiverStateForCallback(
    receiverState: ReceiverState,
  ): ReceiverState | undefined {
    return inlineCallbackReceiverStates.get(this) === receiverState
      ? receiverState
      : undefined;
  }

  /** Evaluates this closure with optional bound receiver capability. */
  public override call(
    argument: Frame,
    parameter: Frame = Frame.nil,
    receiverState?: ReceiverState,
  ): Frame {
    if (this.data.length === 0) {
      // Codify the value, not the caller's captured evaluation context.
      const codified = new FrameExpr(argument.asArray(), argument.meta_copy());
      codified.up = this;
      return codified;
    }

    const prepared = this.prepareArgument(argument);
    if (prepared.is.error) return prepared;

    const enclosing = capturedScopes.get(this) ?? this.legacyCapture();
    const scope = EvaluationScope.call(
      prepared,
      parameter,
      this,
      enclosing,
      receiverState,
    );
    return FrameExpr.evaluateBody(this.data, scope);
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
      .filter((item) => item instanceof FrameSymbol)
      .map((item) => item.toString())
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
