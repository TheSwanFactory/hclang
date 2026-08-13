import { Frame } from "../frames/frame.ts";
import { ScanDisposition, type ScanResponse } from "../scan.ts";

/**
 * Primitive mutations a lexical state exposes to Sigilizer.
 *
 * Syntax-specific Frames decide what should happen; the host owns the mutable
 * token buffer and output connection on which that decision operates.
 */
export interface ScanHost extends Frame {
  /** Append one consumed Symbol and remain active. */
  consumeScan(symbol: Frame): Frame;
  /** Emit the completed value, if any, and return the parent receiver. */
  completeScan(value: Frame | null): Frame;
  /** Install a syntax-specific receiver while retaining the lexical host. */
  transitionScan(next: Frame): ScanResponse;
}

const isScanHost = (receiver: Frame): receiver is ScanHost =>
  "consumeScan" in receiver && receiver.consumeScan instanceof Function &&
  "completeScan" in receiver && receiver.completeScan instanceof Function &&
  "transitionScan" in receiver && receiver.transitionScan instanceof Function;

/** A lexical failure after the Sigilizer turns a scan decision into a Frame. */
class LexicalError extends Frame {
  public constructor(private readonly message: string) {
    super();
    this.is.error = true;
    this.is.lexical = true;
  }

  public override toString(): string {
    return this.message;
  }

  public override scan(_symbol: Frame, _source = ""): Frame {
    return this;
  }

  public override finishInput(_source = ""): Frame {
    return this;
  }
}

/**
 * Stateless boundary between source symbols and the active lexical receiver.
 *
 * Syntax-specific recognition belongs to the receiving Frame. This phase owns
 * the generic routing of the resulting lexical decision.
 */
export class Sigilizer {
  /** Advance one lexical receiver by one source Symbol. */
  public scan(receiver: Frame, symbol: Frame): Frame {
    return this.route(receiver, symbol, receiver.scan(symbol));
  }

  /** Resolve one lexical receiver at physical end-of-input. */
  public finish(receiver: Frame, end: Frame): Frame {
    return this.route(receiver, end, receiver.finishInput());
  }

  private route(
    receiver: Frame,
    symbol: Frame,
    result: ScanResponse,
  ): Frame {
    if (result instanceof Frame) {
      return result;
    }

    if (result.disposition === ScanDisposition.Error) {
      return new LexicalError(result.message ?? "lexical error");
    }

    if (!isScanHost(receiver)) {
      return new LexicalError(
        `${receiver.className()} returned '${result.disposition}' without ` +
          "implementing the lexical host contract",
      );
    }

    switch (result.disposition) {
      case ScanDisposition.Consume:
        return receiver.consumeScan(symbol);
      case ScanDisposition.CompleteConsume:
        return receiver.completeScan(result.frame ?? null);
      case ScanDisposition.CompleteRedispatch: {
        const next = receiver.completeScan(result.frame ?? null);
        return this.scan(next, symbol);
      }
      case ScanDisposition.Transition:
        if (result.frame === undefined) {
          return new LexicalError("lexical transition did not provide a Frame");
        }
        return this.route(
          receiver,
          symbol,
          receiver.transitionScan(result.frame),
        );
    }
  }
}

/** Shared stateless Sigilizer used by source reduction and incremental input. */
export const sigilizer = new Sigilizer();
