import { FrameAtom } from "./frame-atom.ts";
import { type Context, NilContext } from "./context.ts";

export class FrameComment extends FrameAtom {
  public static readonly COMMENT_BEGIN = "#";
  public static readonly COMMENT_END = "#";
  public static readonly COMMENT_END_REGEX = /#/;

  constructor(protected data: string, meta: Context = NilContext) {
    super(meta);
    this.is.void = true;
  }

  public override string_prefix(): string {
    return FrameComment.COMMENT_BEGIN;
  }

  public override string_suffix(): string {
    return FrameComment.COMMENT_END;
  }

  public override canInclude(char: string): boolean {
    return !FrameComment.COMMENT_END_REGEX.test(char);
  }

  protected override toData(): string {
    return this.data;
  }
}
