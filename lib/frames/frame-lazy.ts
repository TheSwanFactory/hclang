import { Frame } from "./frame.ts";
import { FrameExpr } from "./frame-expr.ts";
import { FrameGroup } from "./frame-group.ts";
import { FrameSymbol } from "./frame-symbol.ts";
import { type Context, NilContext } from "./context.ts";
import type { ReceiverState } from "./bound-method.ts";
import type { SigilStart } from "../scan.ts";

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
    // Closures should not display their captured environment metadata
    // Only show the closure body, not the context it was created in
    const result = this.toStringDataArray();
    // Note: We deliberately skip adding meta_string() here
    // unlike the base FrameList implementation

    // Strip the trailing comma from the last element
    if (result.length > 0) {
      const n = result.length - 1;
      const last = result[n];
      if (last.endsWith(",")) {
        result[n] = last.substring(0, last.length - 1);
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
    // Closures always use space separators, not commas
    const body = parts.join(" ").trim();
    // Add padding spaces around non-empty body
    const display = body.length > 0 ? ` ${body} ` : body;
    return [display + ","];
  }

  public override in(contexts: Array<Frame> = [Frame.nil]): Frame {
    const context = contexts[0] ?? Frame.nil;
    this.up = context;
    return this;
  }

  /** Evaluates this closure with an optional bound receiver capability. */
  public override call(
    argument: Frame,
    _parameter: Frame = Frame.nil,
    receiverState?: ReceiverState,
  ): Frame {
    if (this.data.length === 0) {
      // Codify the value, not the caller's captured evaluation context.
      const codified = new FrameExpr(argument.asArray(), argument.meta_copy());
      codified.up = this;
      return codified;
    }

    const prepared = this.prepareArgument(argument);
    if (prepared.is.error) {
      return prepared;
    }

    // Argument and closure are explicit evaluation contexts. Keeping this
    // metadata local lets lookup reach the closure's live parent chain.
    const expr = new FrameExpr(this.data);
    expr.up = this;
    // Receiver state is one typed per-call capability, so repeated calls cannot
    // leak read access, write authority, or copy bounds through this closure.
    expr.receiverState = receiverState;
    // It is also an explicit lookup layer, and it is consulted ahead of this
    // closure: a method's own fields shadow the scope the body was defined in.
    // Bodies are shared between instances, and a shared body's captured scope
    // is whichever instance was built last, so consulting it first would read
    // another instance's fields.
    const receiver = receiverState?.receiver;
    const scope = receiver
      ? [prepared, _parameter, receiver, this]
      : [prepared, _parameter, this];
    return expr.in(scope);
  }

  private prepareArgument(argument: Frame): Frame {
    if (!this.signature) {
      return argument;
    }

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
    if (missing.length === 0) {
      return prepared;
    }

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
