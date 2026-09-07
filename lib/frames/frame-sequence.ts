import { type Context, NilContext } from "./context.ts";
import { Frame } from "./frame.ts";
import { FrameNumeric, type NumericRank } from "./frame-numeric.ts";
import type { MetaFrame } from "./meta-frame.ts";

const SEQUENCE_SOURCE = /^\+?\d+(?:\.\d+){2,}$/;

/** Immutable dotted spelling produced by two or more numeric lookups. */
export class FrameSequence extends FrameNumeric {
  public readonly rank: NumericRank | null = null;
  public readonly spelling: string;
  public readonly segments: readonly string[];

  public constructor(source: string, meta: Context = NilContext) {
    super(meta);
    if (!SEQUENCE_SOURCE.test(source)) {
      throw new TypeError(`invalid numeric sequence source: ${source}`);
    }
    this.spelling = source;
    this.segments = Object.freeze(
      source.replace(/^[+-]/, "").split("."),
    );
  }

  protected override lookup_here(key: string, origin: MetaFrame): Frame {
    if (/^\d+$/.test(key)) {
      return new FrameSequence(`${this.spelling}.${key}`);
    }
    return super.lookup_here(key, origin);
  }

  public override equals(right: Frame): Frame {
    if (
      !(right instanceof FrameSequence) ||
      this.segments.length !== right.segments.length
    ) {
      return Frame.nil;
    }
    return this.segments.every((segment, index) =>
        segment === right.segments[index]
      )
      ? Frame.all
      : Frame.nil;
  }

  public override isZero(): boolean {
    return false;
  }

  public override valueOf(): Frame {
    return Frame.error("$!.numeric-domain projection FrameSequence");
  }

  protected override toData(): string {
    return this.spelling;
  }

  protected override promoteOne(): FrameNumeric {
    return this;
  }

  protected override ratioParts(): null {
    return null;
  }

  protected override inexactResult(_value: number): Frame {
    return Frame.error("$!.numeric-domain projection FrameSequence");
  }

  protected override integralValue(): null {
    return null;
  }

  protected override unaryPlus(): Frame {
    if (this.spelling.startsWith("+") || this.spelling.startsWith("-")) {
      return this;
    }
    return new FrameSequence(`+${this.spelling}`);
  }

  protected override unaryMinus(): Frame {
    return Frame.error("$!.numeric-domain unary- FrameSequence");
  }

  protected override addSame(right: FrameNumeric): Frame {
    return this.operationError("+", right);
  }

  protected override subtractSame(right: FrameNumeric): Frame {
    return this.operationError("-", right);
  }

  protected override multiplySame(right: FrameNumeric): Frame {
    return this.operationError("*", right);
  }

  protected override divideSame(right: FrameNumeric): Frame {
    return this.operationError("/", right);
  }

  protected override moduloSame(right: FrameNumeric): Frame {
    return this.operationError("%%", right);
  }

  protected override powerSame(right: FrameNumeric): Frame {
    return this.operationError("**", right);
  }

  protected override powerIntegral(_exponent: bigint): Frame {
    return Frame.error("$!.numeric-domain ** FrameSequence FrameSequence");
  }

  protected override compareSame(_right: FrameNumeric): null {
    return null;
  }
}
