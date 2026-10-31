import { type Context, NilContext } from "./context.ts";
import { FrameAtom } from "./frame-atom.ts";
import { FrameCount } from "./frame-count.ts";
import { Frame } from "./frame.ts";

/** Lossless data-plane encoding; metadata is carried separately by HC. */
export type DemiEncoding = readonly ["all" | "nil", string, string];

/**
 * Immutable two-channel value. All means left-next; nil means right-next.
 * A constructed zero-load value is present, even with nil orientation.
 * Counts are captured by magnitude, never by mutable host object reference.
 * No source literal or fourth-hash observer is registered by this class.
 */
export class FrameDemi extends FrameAtom {
  private readonly state: readonly [Frame, bigint, bigint];

  public constructor(
    orientation: Frame,
    left: FrameCount,
    right: FrameCount,
    meta: Context = NilContext,
  ) {
    super(meta);
    if (orientation !== Frame.all && orientation !== Frame.nil) {
      throw new TypeError("Demi orientation must be exactly all or nil");
    }
    this.state = Object.freeze([
      orientation,
      FrameDemi.magnitude(left),
      FrameDemi.magnitude(right),
    ]);
  }

  private static magnitude(count: FrameCount): bigint {
    if (!(count instanceof FrameCount) || count.constructor !== FrameCount) {
      throw new TypeError("Demi loads and scalars must be exact FrameCounts");
    }
    if (typeof count.data !== "bigint" || count.data < 0n) {
      throw new RangeError(
        "Demi Counts must have nonnegative bigint magnitudes",
      );
    }
    return count.data;
  }

  /** Native factory with an HC error boundary for dynamically supplied values. */
  public static create(orientation: Frame, left: Frame, right: Frame): Frame {
    try {
      return new FrameDemi(
        orientation,
        left as FrameCount,
        right as FrameCount,
      );
    } catch (error) {
      if (error instanceof TypeError || error instanceof RangeError) {
        return Frame.error("$!.demi-constructor");
      }
      throw error;
    }
  }

  public get orientation(): Frame {
    return this.state[0];
  }

  /** Fresh Count snapshots; input/field Count metadata is not part of the data. */
  public get left(): FrameCount {
    return new FrameCount(this.state[1]);
  }

  public get right(): FrameCount {
    return new FrameCount(this.state[2]);
  }

  /** Deposit once and flip phase, including when the scalar is zero. */
  public addCount(count: FrameCount): FrameDemi {
    const k = FrameDemi.magnitude(count);
    const leftNext = this.orientation === Frame.all;
    return new FrameDemi(
      leftNext ? Frame.nil : Frame.all,
      new FrameCount(this.state[1] + (leftNext ? k : 0n)),
      new FrameCount(this.state[2] + (leftNext ? 0n : k)),
    );
  }

  /** Scale both loads without changing phase. Arithmetic drops outer metadata. */
  public multiplyCount(count: FrameCount): FrameDemi {
    const k = FrameDemi.magnitude(count);
    return new FrameDemi(
      this.orientation,
      new FrameCount(k * this.state[1]),
      new FrameCount(k * this.state[2]),
    );
  }

  public override dataEquals(other: Frame): Frame {
    const right = other.referent();
    return right instanceof FrameDemi &&
        this.orientation === right.orientation &&
        this.state[1] === right.state[1] && this.state[2] === right.state[2]
      ? Frame.all
      : Frame.nil;
  }

  public override equals(other: Frame): Frame {
    return this.dataEquals(other) === Frame.all
      ? this.metadataEquals(other.referent())
      : Frame.nil;
  }

  public encode(): DemiEncoding {
    return Object.freeze([
      this.orientation === Frame.all ? "all" : "nil",
      this.state[1].toString(),
      this.state[2].toString(),
    ]);
  }

  /** Decode data only; invalid encodings fail at the native API boundary. */
  public static decode(value: unknown): FrameDemi {
    if (
      !Array.isArray(value) || value.length !== 3 ||
      (value[0] !== "all" && value[0] !== "nil") ||
      !value.slice(1).every((x) =>
        typeof x === "string" && /^(0|[1-9][0-9]*)$/.test(x)
      )
    ) throw new TypeError("invalid Demi encoding");
    return new FrameDemi(
      value[0] === "all" ? Frame.all : Frame.nil,
      new FrameCount(value[1]),
      new FrameCount(value[2]),
    );
  }

  /** Diagnostic display, not executable HC syntax. */
  protected override toData(): string {
    const phase = this.orientation === Frame.all ? "<>" : "()";
    return `FrameDemi(${phase},${this.state[1]},${this.state[2]})`;
  }
}
