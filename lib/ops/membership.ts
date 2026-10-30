// Enter the aggregate cycle at FrameLazy, as schema matchers do.
import "../frames/frame-lazy.ts";
import { Frame } from "../frames/frame.ts";
import { FrameList } from "../frames/frame-list.ts";
import { isFrameMatcher } from "../frames/frame-match.ts";
import { HasType } from "./type-operations.ts";

type Comparison = (candidate: Frame, element: Frame) => Frame;

/** Only aggregates expose immediate elements; scalar iteration is not membership. */
const member = (candidate: Frame, host: Frame, same: Comparison): Frame => {
  const right = host.referent();
  return right instanceof FrameList &&
      right.elements().some((element) => same(candidate, element) === Frame.all)
    ? Frame.all
    : Frame.nil;
};

/** `~` preserves rich type/schema matching on matcher hosts. */
export const Member = (candidate: Frame, host: Frame): Frame => {
  const right = host.referent();
  if (right === Frame.all || right === Frame.nil || isFrameMatcher(right)) {
    return HasType(candidate.referent(), right);
  }
  return member(candidate, right, (left, element) => left.equals(element));
};

/** `~~` compares immediate elements by the existing typed equality. */
export const TypedMember = (candidate: Frame, host: Frame): Frame =>
  member(candidate, host, (left, element) => left.typeEquals(element));

/** `~~~` compares immediate elements by the existing identity rule. */
export const IdenticalMember = (candidate: Frame, host: Frame): Frame =>
  member(candidate, host, (left, element) => left.identical(element));
