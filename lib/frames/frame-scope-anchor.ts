import { type EvaluationRoots, Frame } from "./frame.ts";
import { FrameAtom } from "./frame-atom.ts";
import { FrameNote } from "./frame-note.ts";
import { FrameSymbol } from "./frame-symbol.ts";
import type { MetaFrame } from "./meta-frame.ts";
import { type EvaluationInput, EvaluationScope } from "./evaluation-scope.ts";
import {
  type AtomSyntax,
  ScanDisposition,
  type ScanResult,
  type SigilStart,
} from "../scan.ts";

/** The two namespaces selected by the dollar family. */
export type ScopeAnchorKind = "file" | "host";

const NOTE_PREFIXES = new Set(["!", "+", "-", "~", "=", ">"]) as ReadonlySet<
  string
>;

const complete = (frame: Frame): ScanResult => ({
  disposition: ScanDisposition.CompleteRedispatch,
  frame,
});

const invalidDollar = (source: string, char = ""): ScanResult => ({
  disposition: ScanDisposition.Error,
  message: `invalid dollar form: $${source}${char === "\n" ? "\\n" : char}`,
});

/** A boundary starts another token rather than extending a dollar form. */
const isBoundary = (char: string): boolean => !/[$\w-]/.test(char);

/**
 * Recognizes anchors and the retained diagnostic-note spellings behind one `$`
 * registration. Longest match keeps `$$` atomic, while unsupported `$word`
 * forms fail on their first character instead of consuming an expression.
 */
const recognizeDollar = (symbol: Frame, source = ""): ScanResult => {
  const char = symbol.toString();

  if (source === "") {
    if (char === "$") {
      return { disposition: ScanDisposition.Consume };
    }
    if (NOTE_PREFIXES.has(char) || char === "<") {
      return { disposition: ScanDisposition.Consume };
    }
    return isBoundary(char)
      ? complete(FrameScopeAnchor.file())
      : invalidDollar(source, char);
  }

  // The consumed second dollar is held until its boundary, so `$$$` cannot be
  // tokenized as a host anchor followed by a file anchor.
  if (source === "$") {
    return isBoundary(char)
      ? complete(FrameScopeAnchor.host())
      : invalidDollar(source, char);
  }

  // `<>` is the only retained note label beginning with `<`; `$<` and `$<<`
  // were vestigial control spellings and are rejected cleanly.
  if (source === "<") {
    return char === ">"
      ? { disposition: ScanDisposition.Consume }
      : invalidDollar(source, char);
  }

  if (char === FrameNote.NOTE_END) {
    return { disposition: ScanDisposition.CompleteRedispatch };
  }
  return { disposition: ScanDisposition.Consume };
};

const finishDollar = (source = ""): ScanResult => {
  if (source === "") return complete(FrameScopeAnchor.file());
  if (source === "$") return complete(FrameScopeAnchor.host());
  if (source === "<") return invalidDollar(source);
  return {
    disposition: ScanDisposition.Error,
    message: `unterminated FrameNote: $${source}`,
  };
};

/**
 * A source-level reference to one named evaluation root.
 *
 * Evaluating the source atom binds a lightweight reference to the current
 * scope. Property reads are target-local, so neither a file nor a host lookup
 * falls through to lexical parents or global operators. The reference itself
 * stays printable as `$` or `$$` and never exposes the namespace contents.
 */
export class FrameScopeAnchor extends FrameAtom {
  public static readonly SIGIL_STARTS = [
    { key: "$", mode: "atom" },
  ] as const satisfies readonly SigilStart[];

  public static readonly SYNTAX: AtomSyntax = {
    NAME: "FrameScopeAnchor",
    SIGIL_STARTS: FrameScopeAnchor.SIGIL_STARTS,
    recognize: recognizeDollar,
    finish: finishDollar,
    fromSource: (source: string): Frame => new FrameNote(source),
  };

  public static file(): FrameScopeAnchor {
    return new FrameScopeAnchor("file");
  }

  public static host(): FrameScopeAnchor {
    return new FrameScopeAnchor("host");
  }

  public constructor(
    public readonly kind: ScopeAnchorKind,
    private readonly fileScope: Frame = Frame.missing,
    private readonly hostNamespace: Frame = Frame.missing,
    private readonly accessor?: Frame,
  ) {
    super();
  }

  public override in(input: EvaluationInput = []): FrameScopeAnchor {
    const scope = EvaluationScope.from(input);
    return new FrameScopeAnchor(
      this.kind,
      scope.fileScope,
      scope.hostNamespace,
      scope.accessOrigin(),
    );
  }

  public override evaluationRoots(): EvaluationRoots {
    return {
      fileScope: this.fileScope,
      hostNamespace: this.hostNamespace,
    };
  }

  public override projectionContext(): Frame {
    return this.kind === "host"
      ? new FrameScopeAnchor(
        "file",
        this.fileScope,
        this.hostNamespace,
        this.accessor,
      )
      : this;
  }

  /** Dotted syntax is the only operation an anchor itself accepts. */
  public override call(argument: Frame, _parameter = Frame.nil): Frame {
    if (argument instanceof FrameSymbol) {
      return argument.in(
        EvaluationScope.anchor(
          this,
          this.fileScope,
          this.hostNamespace,
        ),
      );
    }
    return Frame.error(`$!.scope-not-callable ${this.toString()}`);
  }

  /** Resolve only within the namespace, graded against the real accessor. */
  public override get(key: string, origin: MetaFrame = this): Frame {
    const target = this.target();
    const accessOrigin = origin === this ? this.accessor ?? origin : origin;
    const value = target.get_here(key, accessOrigin);
    return value.is.missing
      ? Frame.error(`$!.name-missing ${this.toString()}.${key}`)
      : value;
  }

  public override string_prefix(): string {
    return "$";
  }

  protected override toData(): string {
    return this.kind === "host" ? "$" : "";
  }

  private target(): Frame {
    return this.kind === "file" ? this.fileScope : this.hostNamespace;
  }
}
