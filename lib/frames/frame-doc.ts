import { FrameString } from "./frame-string.ts";
import { type Context, NilContext } from "./context.ts";
import type { SigilStart } from "../scan.ts";

export class FrameDoc extends FrameString {
  public static readonly DOC_BEGIN = "`";
  public static readonly DOC_END = "`";
  public static override readonly SIGIL_STARTS: readonly SigilStart[] = [
    { key: FrameDoc.DOC_BEGIN, mode: "document" },
  ];

  constructor(
    data: string,
    meta: Context = NilContext,
    public readonly fenceLength = 1,
  ) {
    super(data, meta);
  }

  public override string_prefix(): string {
    return FrameDoc.DOC_BEGIN.repeat(this.fenceLength);
  }

  public override string_suffix(): string {
    if (this.data === "" && this.fenceLength % 2 === 0) {
      return "";
    }
    return FrameDoc.DOC_END.repeat(this.fenceLength);
  }
}
