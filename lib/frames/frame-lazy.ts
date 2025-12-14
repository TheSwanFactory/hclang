import { Frame } from "./frame.ts";
import { FrameExpr } from "./frame-expr.ts";
import { type Context, NilContext } from "./context.ts";

export class FrameLazy extends FrameExpr {
  public static readonly LAZY_BEGIN = "{";
  public static readonly LAZY_END = "}";

  constructor(data: Array<Frame>, meta: Context = NilContext) {
    super(data, meta);
  }

  public override string_open(): string {
    return FrameLazy.LAZY_BEGIN;
  }

  public override string_close(): string {
    return FrameLazy.LAZY_END;
  }

  public override toStringDataArray(): string[] {
    const stringify = (obj: Frame): string => {
      if (obj instanceof FrameExpr) {
        return obj.asArray().map(stringify).join(" ");
      }
      return obj.toString();
    };
    const parts = this.data.map(stringify);
    const needsPadding = this.data.length === 1 &&
      this.data[0] instanceof FrameExpr &&
      (this.data[0] as FrameExpr).asArray().length > 1;
    const separator = this.meta_length() > 1 ? ", " : " ";
    const body = parts.join(separator).trim();
    const display = needsPadding ? ` ${body} ` : body;
    return [display + ","];
  }

  public override in(contexts: Array<Frame> = [Frame.nil]): Frame {
    const context = contexts[0] ?? Frame.nil;
    this.meta = this.meta_for(context);
    this.up = context;
    return this;
  }

  public override call(
    argument: Frame,
    _parameter: Frame = Frame.nil,
  ): Frame {
    if (this.data.length === 0) {
      const codified = new FrameExpr(
        argument.asArray(),
        this.meta_for(argument),
      );
      codified.up = this;
      return codified;
    }

    const expr = new FrameExpr(this.data, this.meta_for(argument));
    expr.up = this;
    return expr.in([argument, _parameter, this]);
  }

  protected meta_for(context: Frame): Context {
    const contextMeta = context.meta === NilContext ? {} : context.meta;
    const selfMeta = this.meta === NilContext ? {} : this.meta;

    const leading = Object.keys(selfMeta).filter((key) =>
      !(key in contextMeta)
    );
    const contextKeys = Object.keys(contextMeta);
    const trailing = Object.keys(selfMeta).filter((
      key,
    ) => (key in contextMeta));

    const orderedKeys = [...leading, ...contextKeys, ...trailing];
    const MetaNew: Context = {};
    orderedKeys.forEach((key) => {
      MetaNew[key] = (key in contextMeta) ? contextMeta[key] : selfMeta[key];
    });
    return MetaNew;
  }
}
