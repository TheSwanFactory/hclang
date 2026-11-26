import { Frame } from "./frame.ts";
import {
  type FrameMatcher,
  matchFailure,
  type MatchResult,
  matchSuccess,
} from "./frame-match.ts";
import { FrameNumeric } from "./frame-numeric.ts";

/** A first-class runtime type extracted from a representative Frame. */
export class FrameType extends Frame implements FrameMatcher {
  public constructor(
    private readonly FrameClass: typeof Frame,
    private readonly representative: Frame,
  ) {
    super();
  }

  public static of(representative: Frame): FrameType {
    representative = representative.referent();
    return new FrameType(
      representative.constructor as typeof Frame,
      representative,
    );
  }

  public matches(value: Frame): boolean {
    return this.match(value).matched;
  }

  /**
   * Membership is exact, except on the numeric ladder: a ranked numeric type
   * admits a value from its own rung or any lower rung, and the value is bound
   * unchanged (#410). Narrowing is refused whatever the value, and unranked
   * numerics and every other subclass pair still match exactly.
   */
  public match(value: Frame): MatchResult {
    const referent = value.referent();
    return referent.constructor === this.FrameClass ||
        this.admitsLowerRung(referent)
      ? matchSuccess(value)
      : matchFailure(
        Frame.error(`$!.type-error ${this.toString()} ${value.toString()}`),
      );
  }
  private admitsLowerRung(referent: Frame): boolean {
    const type = this.representative;
    return type instanceof FrameNumeric && referent instanceof FrameNumeric &&
      type.rank !== null && referent.rank !== null &&
      referent.rank <= type.rank;
  }

  public override apply(argument: Frame): Frame {
    const result = this.match(argument);
    return result.matched ? result.evidence : result.error;
  }

  public override toString(): string {
    return `(${this.representative.toString()}).<>`;
  }

  public override dataString(): string {
    return this.toString();
  }
}
