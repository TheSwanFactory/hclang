import { completeAtEnd, includeOrReserve } from "./atom-syntax.ts";
import { type Context, NilContext } from "./context.ts";
import type { Frame } from "./frame.ts";
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
   * A count is its own size, so `.#` and `.##` both answer it (#411). A count
   * is not a Figure, so `.###` answers nil, as for any atom (010.04). The
   * spelling is the literal `Frame.kRESIDUAL`, since this module imports
   * `Frame` as a type only.
   */
  public override sizeFor(key: string): Frame {
    return key === "###" ? super.sizeFor(key) : this;
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
