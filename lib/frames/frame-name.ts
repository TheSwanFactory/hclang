import { Frame } from "./frame.ts";
import { FrameAtom } from "./frame-atom.ts";
import { FrameOperator, FrameSymbol } from "./frame-symbol.ts";
import type { ISourced } from "./meta-frame.ts";
import { NilContext } from "./context.ts";
import { type EvaluationInput, EvaluationScope } from "./evaluation-scope.ts";
import { completeAtEnd } from "./atom-syntax.ts";
import { authorizedReceiverWriteTarget } from "./bound-method.ts";
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
  // consumed and completed like any other name.
  if (!includes(char)) {
    return { disposition: ScanDisposition.CompleteRedispatch };
  }
  if (source.length === 0) {
    return { disposition: ScanDisposition.Consume };
  }

  const startsWithOperator = FrameOperator.Accepts(source[0]);
  const continuesIdentifier = char[0] === "-" && !startsWithOperator;
  const sameKind = FrameOperator.Accepts(char[0]) === startsWithOperator;
  return {
    disposition: continuesIdentifier || sameKind
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

  /** Resolves declarations through the scope's explicit write-target role. */
  public override in(input: EvaluationInput = []): Frame {
    const scope = EvaluationScope.from(input);
    // The empty name denotes the current iterator accumulator when supplied.
    if (this.source === "" && scope.parameter) {
      return scope.parameter;
    }

    // Construction declares the new aggregate's parent. Method-position `.^`
    // instead re-parents the exact original-or-copy target authorized by the
    // bound method's declared effect and receiver handle mutability.
    if (
      this.source === FrameName.PARENT_DECLARATION &&
      scope.writeTargetRole !== "construction"
    ) {
      if (!scope.receiverState) {
        return Frame.error(`$!.parent-not-declarable .${this.source}`);
      }
      const target = authorizedReceiverWriteTarget(scope.receiverState);
      if (!target) {
        return Frame.error(`$!.method-not-mutating .${this.source}`);
      }
      return this.data.setter(target);
    }
    return this.data.setter(scope.writeTarget);
  }

  public override string_prefix(): string {
    return FrameName.NAME_BEGIN;
  }

  protected override toData(): FrameSymbol {
    return this.data;
  }
}
