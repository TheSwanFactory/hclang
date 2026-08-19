import { Frame } from "./frame.ts";
import { FrameHandle } from "./frame-handle.ts";
import { FrameAtom } from "./frame-atom.ts";
import { FrameOperator, FrameSymbol } from "./frame-symbol.ts";
import type { ISourced } from "./meta-frame.ts";
import { NilContext } from "./context.ts";
import { completeAtEnd } from "./atom-syntax.ts";
import {
  type AtomSyntax,
  ScanDisposition,
  type ScanResult,
  type SigilStart,
} from "../scan.ts";

/** A name accepts identifier and operator characters alike. */
const includes = (char: string): boolean =>
  FrameSymbol.SYMBOL_CHAR.test(char) || FrameOperator.OPERATOR_CHARS.test(char);

/** A name continues while its spelling stays one kind of identifier. */
const recognizeName = (symbol: Frame, source = ""): ScanResult => {
  const char = symbol.toString();
  if (source.endsWith("^")) {
    return { disposition: ScanDisposition.CompleteRedispatch };
  }
  const mutatingSuffix = FrameSymbol.scanMutatingSuffix(source, char);
  if (mutatingSuffix) {
    return mutatingSuffix;
  }
  // `.^` needs no rule of its own: `^` is an operator character, so it is
  // consumed and completed like any other name. This branch keeps the retired
  // `._^` spelling a single name, so evaluation can refuse it by name instead
  // of letting it break into `._` and a stray `^`. It exists only to serve that
  // refusal, so it is deleted with it (#332).
  const retiredParentDeclaration = source === "_" && char === "^";
  if (!retiredParentDeclaration && !includes(char)) {
    return { disposition: ScanDisposition.CompleteRedispatch };
  }
  if (source.length === 0) {
    return { disposition: ScanDisposition.Consume };
  }

  const startsWithOperator = FrameOperator.Accepts(source[0]);
  const continuesIdentifier = char[0] === "-" && !startsWithOperator;
  const sameKind = FrameOperator.Accepts(char[0]) === startsWithOperator;
  return {
    disposition: retiredParentDeclaration || continuesIdentifier || sameKind
      ? ScanDisposition.Consume
      : ScanDisposition.CompleteRedispatch,
  };
};

export class FrameName extends FrameAtom implements ISourced {
  public static readonly NAME_BEGIN = ".";
  /** The spelling that declares a parent, as `.^ base`. */
  public static readonly PARENT_DECLARATION = "^";
  public static readonly SIGIL_STARTS = [
    { key: FrameName.NAME_BEGIN, mode: "atom" },
  ] as const satisfies readonly SigilStart[];

  public static readonly SYNTAX: AtomSyntax = {
    NAME: "FrameName",
    SIGIL_STARTS: FrameName.SIGIL_STARTS,
    recognize: recognizeName,
    finish: completeAtEnd,
    fromSource: (source: string): Frame => new FrameName(source),
  };

  public source: string;
  protected data: FrameSymbol;

  constructor(source: string, meta = NilContext) {
    super(meta);
    this.data = FrameSymbol.for(source);
    this.source = source;
  }

  /**
   * A name binds to the innermost frame that declared itself a declaration
   * target, and to the statement context when none did. Frames say whether they
   * accept declarations; this no longer counts nested groups to guess.
   *
   * Why a target matched is reported too, because one name accepts only the
   * frame under construction: see `in`.
   */
  private bindingTarget(
    contexts: Frame[],
  ): { out: Frame; via: "construction" | "handle" | "statement" } {
    for (let i = contexts.length - 1; i >= 0; i--) {
      const context = contexts[i];
      if (context instanceof FrameHandle) {
        return { out: context.unwrap(), via: "handle" };
      }
      if (context.declares) {
        return { out: context, via: "construction" };
      }
    }
    return { out: contexts[0], via: "statement" };
  }

  public override in(contexts = [Frame.nil]): Frame {
    // The empty name denotes the current iterator accumulator when supplied.
    if (this.source === "" && contexts.length > 1) {
      return contexts[1];
    }
    const { out, via } = this.bindingTarget(contexts);
    // The parent link is structural, not an ordinary binding, so it is
    // declarable only on the aggregate under construction. Elsewhere — a method
    // body, most notably — the target would be the argument, so the write would
    // re-parent the wrong frame, and it reported a spurious cycle whenever the
    // argument and the receiver were the same frame. Refuse by name instead.
    if (
      this.source === FrameName.PARENT_DECLARATION && via !== "construction"
    ) {
      return Frame.error(`$!.parent-not-declarable .${this.source}`);
    }
    const setter = this.data.setter(out);
    return setter;
  }

  public override string_prefix(): string {
    return FrameName.NAME_BEGIN;
  }

  protected override toData(): FrameSymbol {
    return this.data;
  }
}
