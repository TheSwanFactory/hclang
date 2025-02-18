import { FrameString } from "./frame-string.ts";
import { type Context, NilContext } from "./context.ts";

export class FrameDoc extends FrameString {
  public static readonly DOC_BEGIN = "`";
  public static readonly DOC_END = "`";

  constructor(data: string, meta: Context = NilContext) {
    super(data, meta);
  }

  public override string_prefix(): string {
    return FrameDoc.DOC_BEGIN;
  }

  public override string_suffix(): string {
    return FrameDoc.DOC_END;
  }
}
