import { Frame } from "../frames/frame.ts";

export type LexicalMode = "atom" | "document" | "push" | "pop";

export interface SigilStart {
  readonly key: string;
  readonly mode: LexicalMode;
}

export type ScanResult =
  | { readonly disposition: "consume" }
  | {
    readonly disposition: "complete";
    readonly redispatch: boolean;
    readonly value: Frame | null;
  }
  | { readonly disposition: "transition"; readonly next: Frame }
  | { readonly disposition: "error"; readonly message: string };

export type ScanResponse = Frame | ScanResult;

/** Constructors for the small result language understood by Sigilizer. */
export const Scan = Object.freeze({
  consume: (): ScanResult => ({ disposition: "consume" }),
  completeConsume: (value: Frame | null = null): ScanResult => ({
    disposition: "complete",
    redispatch: false,
    value,
  }),
  completeRedispatch: (value: Frame | null = null): ScanResult => ({
    disposition: "complete",
    redispatch: true,
    value,
  }),
  transition: (next: Frame): ScanResult => ({
    disposition: "transition",
    next,
  }),
  error: (message: string): ScanResult => ({ disposition: "error", message }),
});

export interface ScanHost extends Frame {
  consumeScan(symbol: Frame): Frame;
  completeScan(value: Frame | null): Frame;
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
  public scan(receiver: Frame, symbol: Frame): Frame {
    return this.route(receiver, symbol, receiver.scan(symbol));
  }

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

    if (result.disposition === "error") {
      return new LexicalError(result.message);
    }

    if (!isScanHost(receiver)) {
      return new LexicalError(
        `${receiver.className()} returned '${result.disposition}' without ` +
          "implementing the lexical host contract",
      );
    }

    switch (result.disposition) {
      case "consume":
        return receiver.consumeScan(symbol);
      case "complete": {
        const next = receiver.completeScan(result.value);
        return result.redispatch ? this.scan(next, symbol) : next;
      }
      case "transition":
        return this.route(
          receiver,
          symbol,
          receiver.transitionScan(result.next),
        );
    }
  }
}

export const sigilizer = new Sigilizer();
