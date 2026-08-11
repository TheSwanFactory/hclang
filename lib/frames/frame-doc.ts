import { FrameString } from "./frame-string.ts";
import { type Context, NilContext } from "./context.ts";

export class FrameDoc extends FrameString {
  public static readonly DOC_BEGIN = "`";
  public static readonly DOC_END = "`";
  public static readonly LONG_DELIMITER_LEVEL = 3;

  constructor(
    data: string,
    meta: Context = NilContext,
    public readonly delimiterLevel: 1 | 3 = 1,
  ) {
    super(data, meta);
  }

  public override string_prefix(): string {
    return FrameDoc.DOC_BEGIN.repeat(this.delimiterLevel);
  }

  public override string_suffix(): string {
    return FrameDoc.DOC_END.repeat(this.delimiterLevel);
  }
}
