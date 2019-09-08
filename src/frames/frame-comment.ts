import { FrameQuote } from "./frame-atom";
import { Context, NilContext } from "./meta-frame";

export class FrameComment extends FrameQuote {
  public static readonly COMMENT_BEGIN = "#";
  public static readonly COMMENT_END = "#";
  public static readonly COMMENT_EOL = "\n";
  public static readonly COMMENT_END_REGEX = /[#\n]/;

  constructor(protected data: string, meta: Context = NilContext) {
    super(meta);
    this.is.void = true;
  }

  public string_prefix() { return FrameComment.COMMENT_BEGIN; };

  public string_suffix() { return FrameComment.COMMENT_END; };

  public canInclude(char: string) {
    return !FrameComment.COMMENT_END_REGEX.test(char);
  }

  protected toData() { return this.data; }
};
