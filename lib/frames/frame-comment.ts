import { FrameQuote } from "./frame-atom.ts";
import { type Context, NilContext } from "./context.ts";
import type { Frame } from "./frame.ts";
import { completeAtEnd } from "./atom-syntax.ts";
import {
  type AtomSyntax,
  ScanDisposition,
  type ScanResult,
  type SigilStart,
} from "../scan.ts";

export class FrameComment extends FrameQuote {
  public static readonly COMMENT_BEGIN = "#";
  public static readonly COMMENT_END = "#";
  public static readonly COMMENT_END_REGEX = /#|\n/;
  public static readonly SIGIL_STARTS = [
    { key: FrameComment.COMMENT_BEGIN, mode: "atom" },
  ] as const satisfies readonly SigilStart[];

  public static readonly SYNTAX: AtomSyntax = {
    NAME: "FrameComment",
    SIGIL_STARTS: FrameComment.SIGIL_STARTS,
    recognize: (symbol: Frame): ScanResult => {
      const char = symbol.toString();
      if (!FrameComment.COMMENT_END_REGEX.test(char)) {
        return { disposition: ScanDisposition.Consume };
      }
      // `#` closes the comment; a newline ends it but belongs to its line.
      return {
        disposition: char === FrameComment.COMMENT_END
          ? ScanDisposition.CompleteConsume
          : ScanDisposition.CompleteRedispatch,
      };
    },
    finish: completeAtEnd,
    fromSource: (source: string): Frame => new FrameComment(source),
  };

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

  protected override toData(): string {
    return this.data;
  }
}
