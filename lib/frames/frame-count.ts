import { completeAtEnd, includeOrReserve } from "./atom-syntax.ts";
import { type Context, NilContext } from "./context.ts";
import { Frame } from "./frame.ts";
import { FrameInt } from "./frame-int.ts";
import {
  type FrameNumeric,
  NUMERIC_RANK,
  type NumericRank,
} from "./frame-numeric.ts";
import type { AtomSyntax, ScanResult, SigilStart } from "../scan.ts";

/**
 * Exact nonnegative integer, the root of the numeric ladder, and owner of
 * decimal-digit source syntax: every digit literal is a count, `0` and
 * `1234567890` alike.
 *
 * A count is a FrameInt that cannot be negative, so whatever accepts an integer
 * accepts a count, and it prints exactly as the same integer does. It is closed
 * under `+`, `*`, `%%`, and a nonnegative integral `**`, which therefore answer
 * counts. The operations that can leave the domain answer the rung that holds
 * their result whatever its sign: unary minus and `-` answer a FrameInt, and
 * `/` answers a ratio, which collapses to a FrameInt when it is whole.
 */
export class FrameCount extends FrameInt {
  public static readonly SIGIL_STARTS: readonly SigilStart[] = [
    { key: FrameCount.NUMBER_BEGIN.toString(), mode: "atom" },
  ];

  public static readonly SYNTAX: AtomSyntax = {
    NAME: "FrameCount",
    SIGIL_STARTS: FrameCount.SIGIL_STARTS,
    recognize: (symbol: Frame, source = ""): ScanResult => {
      const char = symbol.toString();
      return includeOrReserve(char, FrameCount.NUMBER_CHAR.test(char), source);
    },
    finish: completeAtEnd,
    fromSource: (source: string): Frame => FrameCount.for(source),
  };

  public static override for(source: string): FrameCount {
    return new FrameCount(source);
  }

  public override readonly rank: NumericRank = NUMERIC_RANK.count;

  public constructor(
    source: string | bigint,
    meta: Context = NilContext,
    spelling?: string,
  ) {
    super(source, meta, spelling);
    if (this.data < 0n || this.spelling.startsWith("-")) {
      throw new RangeError(`count must not be negative: ${this.spelling}`);
    }
  }

  /**
   * A count is its own immediate count and Size (#411). Its residual, Count
   * parity n mod 2, comes from the base Frame rule (011.18k, 011.18m).
   * Unknown keys must not inherit the old accidental Count fallback.
   */
  public override sizeFor(key: string): Frame {
    switch (key) {
      case Frame.kCOUNT:
      case Frame.kLEAVES:
        return this;
      default:
        return super.sizeFor(key);
    }
  }

  protected override promoteOne(): FrameNumeric {
    return new FrameInt(this.data);
  }

  protected override sameRung(value: bigint): FrameInt {
    return new FrameCount(value);
  }

  protected override unaryPlus(): Frame {
    return this.spelling.startsWith("+")
      ? this
      : new FrameCount(this.data, NilContext, `+${this.spelling}`);
  }
}

Frame.count = (value: bigint): FrameCount => new FrameCount(value);
