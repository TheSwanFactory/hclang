import { FrameString } from "./frame-string.ts";
import { type Context, NilContext } from "./context.ts";
import type { AtomSyntax, RunSyntax, SigilStart } from "../scan.ts";

export class FrameDoc extends FrameString {
  public static readonly DOC_BEGIN = "`";
  public static readonly DOC_END = "`";
  public static override readonly SIGIL_STARTS: readonly SigilStart[] = [
    { key: FrameDoc.DOC_BEGIN, mode: "run" },
  ];
  public static override readonly RUN_DELIMITER = FrameDoc.DOC_BEGIN;
  public static override readonly RUN_LABEL = "document";
  /** Document bodies are foreign prose, so HC reads no markers inside them. */
  public static override readonly RUN_OPAQUE = true;

  /** Builds one document from its body and classified fence length. */
  public static override fromRun(body: string, runLength: number): FrameDoc {
    return new FrameDoc(body, NilContext, runLength);
  }

  /**
   * Documents register only a run start, so only the run facet differs.
   *
   * The inherited atom facet builds a single-fence document from its body; the
   * dispatch table never selects it, because `` ` `` is registered as a run.
   */
  public static override readonly SYNTAX: AtomSyntax & RunSyntax = {
    ...FrameString.SYNTAX,
    NAME: "FrameDoc",
    SIGIL_STARTS: FrameDoc.SIGIL_STARTS,
    fromSource: (source: string): FrameDoc => new FrameDoc(source),
    RUN_DELIMITER: FrameDoc.RUN_DELIMITER,
    RUN_LABEL: FrameDoc.RUN_LABEL,
    RUN_OPAQUE: FrameDoc.RUN_OPAQUE,
    fromRun: FrameDoc.fromRun,
  };

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
