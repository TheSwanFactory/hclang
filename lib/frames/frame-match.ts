import { Frame } from "./frame.ts";

export type MatchSuccess = {
  matched: true;
  evidence: Frame;
};

export type MatchFailure = {
  matched: false;
  error: Frame;
};

/** The pure result shared by type membership and evidence-producing matching. */
export type MatchResult = MatchSuccess | MatchFailure;

/** A first-class value that can decide membership and produce match evidence. */
export interface FrameMatcher {
  match(value: Frame, origin?: Frame): MatchResult;
}

export type MatchableFrame = Frame & FrameMatcher;

export function isFrameMatcher(value: Frame): value is MatchableFrame {
  return typeof (value as Partial<FrameMatcher>).match === "function";
}

export function matchSuccess(evidence: Frame): MatchSuccess {
  return { matched: true, evidence };
}

export function matchFailure(error: Frame): MatchFailure {
  return { matched: false, error };
}
