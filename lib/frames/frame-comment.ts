import { FrameQuote } from "./frame-atom.ts";
import { type Context, NilContext } from "./context.ts";
import type { Frame } from "./frame.ts";
import { ScanDisposition, type ScanResult, type SigilStart } from "../scan.ts";

export class FrameComment extends FrameQuote {
  public static readonly COMMENT_BEGIN = "#";
  public static readonly COMMENT_END = "#";
  public static readonly COMMENT_END_REGEX = /#|\n/;
  public static readonly SIGIL_STARTS = [
    { key: FrameComment.COMMENT_BEGIN, mode: "atom" },
  ] as const satisfies readonly SigilStart[];

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

  public override scan(symbol: Frame, _source = ""): ScanResult {
    const char = symbol.toString();
    if (char === FrameComment.COMMENT_END) {
      return { disposition: ScanDisposition.CompleteConsume };
    }
    if (char === "\n") {
      return { disposition: ScanDisposition.CompleteRedispatch };
    }
    return { disposition: ScanDisposition.Consume };
  }

  public override finishInput(_source = ""): ScanResult {
    return { disposition: ScanDisposition.CompleteRedispatch };
  }

  protected override toData(): string {
    return this.data;
  }
}
