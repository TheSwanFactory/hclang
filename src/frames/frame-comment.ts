import { Context, Frame, FrameAtom, NilContext } from "./frame";

export class FrameComment extends FrameAtom {
  public static readonly COMMENT_BEGIN = "#";
  public static readonly COMMENT_END = "#";

  constructor(protected data: string, meta: Context = NilContext) {
    super(meta);
  }

  public string_prefix() { return FrameComment.COMMENT_BEGIN; };

  public string_suffix() { return FrameComment.COMMENT_END; };

  protected toData() { return this.data; }
};
