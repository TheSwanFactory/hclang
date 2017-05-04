import {  Frame } from "./frame";
import { FrameQuote } from "./frame-atom";
import { Context, NilContext } from "./meta-frame";

export class FrameComment extends FrameQuote {
  public static readonly COMMENT_BEGIN = "#";
  public static readonly COMMENT_END = "#";
  public static readonly COMMENT_EOL = "\n";

  constructor(protected data: string, meta: Context = NilContext) {
    super(meta);
  }

  public isVoid() { return true; };

  public string_prefix() { return FrameComment.COMMENT_BEGIN; };

  public string_suffix() { return FrameComment.COMMENT_END; };

  public canInclude(char: string) {
    switch (char) {
      case FrameComment.COMMENT_END: {
        return false;
      }
      case FrameComment.COMMENT_EOL: {
        return false;
      }
    }
    return true;
  }

  protected toData() { return this.data; }
};
