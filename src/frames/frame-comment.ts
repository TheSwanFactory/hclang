import { Context, Frame, NilContext } from "./frame";
import { FrameQuote } from "./frame-atom";

export class FrameComment extends FrameQuote {
  public static readonly COMMENT_BEGIN = "#";
  public static readonly COMMENT_END = "#";

  constructor(protected data: string, meta: Context = NilContext) {
    super(meta);
  }

  public isVoid() { return true; };

  public string_prefix() { return FrameComment.COMMENT_BEGIN; };

  public string_suffix() { return FrameComment.COMMENT_END; };

  protected toData() { return this.data; }
};
