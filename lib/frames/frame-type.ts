import { Frame } from "./frame.ts";
import {
  type FrameMatcher,
  matchFailure,
  type MatchResult,
  matchSuccess,
} from "./frame-match.ts";

/** A first-class runtime type extracted from a representative Frame. */
export class FrameType extends Frame implements FrameMatcher {
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
    return this.match(value).matched;
  }

  public match(value: Frame): MatchResult {
    return value.constructor === this.FrameClass
      ? matchSuccess(value)
      : matchFailure(
        Frame.error(`$!.type-error ${this.toString()} ${value.toString()}`),
      );
  }

  public override apply(argument: Frame): Frame {
    const result = this.match(argument);
    return result.matched ? result.evidence : result.error;
  }

  public override toString(): string {
    return `~~${this.representative.toString()}`;
  }

  public override dataString(): string {
    return this.toString();
  }
}
