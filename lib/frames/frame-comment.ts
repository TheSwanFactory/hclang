import { FrameQuote } from "./frame-atom.ts";
import { type Context, NilContext } from "./context.ts";
import type { Frame } from "./frame.ts";
import { LexicalScan } from "./lexical-scan.ts";

export class FrameComment extends FrameQuote {
  public static readonly COMMENT_BEGIN = "#";
  public static readonly COMMENT_END = "#";
  public static readonly COMMENT_END_REGEX = /#|\n/;

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

  public override scan(symbol: Frame, _source = ""): LexicalScan {
    const char = symbol.toString();
    if (char === FrameComment.COMMENT_END) {
      return LexicalScan.completeConsume();
    }
    if (char === "\n") {
      return LexicalScan.completeRedispatch();
    }
    return LexicalScan.consume();
  }

  public override finishInput(_source = ""): LexicalScan {
    return LexicalScan.completeConsume();
  }

  protected override toData(): string {
    return this.data;
  }
}
