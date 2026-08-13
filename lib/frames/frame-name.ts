import { Frame } from "./frame.ts";
import { FrameArray } from "./frame-array.ts";
import { FrameAtom } from "./frame-atom.ts";
import { FrameOperator, FrameSymbol } from "./frame-symbol.ts";
import type { ISourced } from "./meta-frame.ts";
import { NilContext } from "./context.ts";
import { ScanDisposition, type ScanResult, type SigilStart } from "../scan.ts";

export class FrameName extends FrameAtom implements ISourced {
  public static readonly NAME_BEGIN = ".";
  public static readonly SIGIL_STARTS = [
    { key: FrameName.NAME_BEGIN, mode: "atom" },
  ] as const satisfies readonly SigilStart[];

  public source: string;
  protected data: FrameSymbol;

  constructor(source: string, meta = NilContext) {
    super(meta);
    this.data = FrameSymbol.for(source);
    this.source = source;
  }

  private bindingTarget(contexts: Frame[]): Frame {
    for (let i = contexts.length - 1; i >= 0; i--) {
      const context = contexts[i];
      if (context instanceof FrameArray) {
        return context;
      }
    }
    return contexts[0];
  }

  public override in(contexts = [Frame.nil]): Frame {
    // The empty name denotes the current iterator accumulator when supplied.
    if (this.source === "" && contexts.length > 1) {
      return contexts[1];
    }
    const out = this.bindingTarget(contexts);
    const setter = this.data.setter(out);
    return setter;
  }

  public override string_prefix(): string {
    return FrameName.NAME_BEGIN;
  }

  public override canInclude(char: string): boolean {
    return FrameSymbol.SYMBOL_CHAR.test(char) ||
      FrameOperator.OPERATOR_CHARS.test(char);
  }

  public override scan(symbol: Frame, source = this.source): ScanResult {
    const char = symbol.toString();
    if (!this.canInclude(char)) {
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
  }

  protected override toData(): FrameSymbol {
    return this.data;
  }
}
