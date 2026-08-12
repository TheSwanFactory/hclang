import { Frame } from "./frame.ts";

export type LexicalMode = "atom" | "document" | "push" | "pop";

export interface SigilStart {
  key: string;
  mode: LexicalMode;
}

export type ScanDisposition =
  | "consume"
  | "complete-consume"
  | "complete-redispatch"
  | "transition"
  | "error";

/** A Frame-shaped lexical decision returned by syntax-owned `scan()` methods. */
export class LexicalScan extends Frame {
  private constructor(
    public readonly disposition: ScanDisposition,
    public readonly value: Frame | null = null,
    public readonly next: Frame | null = null,
    public readonly message: string | null = null,
  ) {
    super();
    if (disposition === "error") {
      this.is.error = true;
      this.is.lexical = true;
    }
  }

  public static consume(): LexicalScan {
    return new LexicalScan("consume");
  }

  public static completeConsume(value: Frame | null = null): LexicalScan {
    return new LexicalScan("complete-consume", value);
  }

  public static completeRedispatch(value: Frame | null = null): LexicalScan {
    return new LexicalScan("complete-redispatch", value);
  }

  public static transition(next: Frame): LexicalScan {
    return new LexicalScan("transition", null, next);
  }

  public static error(message: string): LexicalScan {
    return new LexicalScan("error", null, null, message);
  }

  public override toString(): string {
    return this.message ?? this.disposition;
  }

  public override scan(_symbol: Frame, _source = ""): Frame {
    return this;
  }

  public override finishInput(_source = ""): Frame {
    return this;
  }
}
