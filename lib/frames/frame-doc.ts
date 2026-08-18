import type { Frame } from "./frame.ts";
import { FrameAtom } from "./frame-atom.ts";
import { type CharacterContent, FrameText } from "./frame-text.ts";
import { concatenateText, FrameString } from "./frame-string.ts";
import { type Context, NilContext } from "./context.ts";
import type { MetaFrame } from "./meta-frame.ts";
import type { RunSyntax, SigilStart } from "../scan.ts";

/**
 * Foreign content, held verbatim.
 *
 * A document denotes prose rather than HC characters, so it is a sibling of
 * `FrameString` rather than a kind of string: its fences are preserved, its body
 * owns its own line conventions, and HC reads no markers inside it. Its
 * characters remain reachable through the `body` property and through
 * juxtaposition, neither of which changes what the delimiter denotes.
 */
export class FrameDoc extends FrameText implements CharacterContent {
  public static readonly DOC_BEGIN = "`";
  public static readonly DOC_END = "`";
  /** Property exposing this document's characters without its fences. */
  public static readonly BODY_KEY = "body";
  public static readonly SIGIL_STARTS: readonly SigilStart[] = [
    { key: FrameDoc.DOC_BEGIN, mode: "run" },
  ];
  public static readonly RUN_DELIMITER = FrameDoc.DOC_BEGIN;
  public static readonly RUN_LABEL = "document";
  /** Document bodies are foreign prose, so HC reads no markers inside them. */
  public static readonly RUN_OPAQUE = true;

  /** Builds one document from its body and classified fence length. */
  public static fromRun(body: string, runLength: number): FrameDoc {
    return new FrameDoc(body, NilContext, runLength);
  }

  /** Documents are run-delimited only, so they register no atom facet. */
  public static readonly SYNTAX: RunSyntax = {
    NAME: "FrameDoc",
    SIGIL_STARTS: FrameDoc.SIGIL_STARTS,
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

  public characterContent(): string {
    return this.data;
  }

  /**
   * Resolves `body` on lookup rather than storing it.
   *
   * Stored metadata would switch the shared atom renderer to its braced form and
   * break fence round-tripping, and would hold the body twice.
   */
  public override get(key: string, origin: MetaFrame = this): Frame {
    if (key === FrameDoc.BODY_KEY) {
      return new FrameString(this.data);
    }
    return super.get(key, origin);
  }

  public override apply(argument: FrameAtom): FrameString {
    return concatenateText(this, argument);
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
