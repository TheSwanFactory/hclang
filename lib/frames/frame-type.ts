import { Frame } from "./frame.ts";

/** A first-class runtime type extracted from a representative Frame. */
export class FrameType extends Frame {
  public constructor(
    private readonly FrameClass: typeof Frame,
    private readonly representative: Frame,
  ) {
    super();
  }

  public static of(representative: Frame): FrameType {
    return new FrameType(
      representative.constructor as typeof Frame,
      representative,
    );
  }

  public matches(value: Frame): boolean {
    return value.constructor === this.FrameClass;
  }

  public override toString(): string {
    return `~~${this.representative.toString()}`;
  }

  public override dataString(): string {
    return this.toString();
  }
}
