import { Frame } from "./frame.ts";
import { FrameExpr } from "./frame-expr.ts";
import { FrameLazy } from "./frame-lazy.ts";
import { FrameString } from "./frame-string.ts";
import { FrameSymbol } from "./frame-symbol.ts";
import type { EvaluationScope } from "./evaluation-scope.ts";

/**
 * SPIKE INSTRUMENTATION for a13a. Throwaway.
 *
 * a13 spells the recovery property `.$:`, which does not lex today (a13 §10).
 * The spike uses an ordinary name so the spelling decision cannot gate the
 * mechanism, per a13a §3.
 */
export const RECOVERY_KEY = "recover";

/**
 * Which boundary attempts recovery, so a13a Q1 is answered by running each
 * combination rather than by reading the reduce. Production code would wire one
 * set and delete this.
 *
 * - `term`: frame-expr.ts, a term that evaluated to a failure. a13 §6's site.
 * - `apply`: frame-expr.ts, the combination step that failed. Not enumerated by
 *   a13 or a13a; this is where `1 / 0` actually fails.
 * - `body`: frame-expr.ts evaluateBody, a `;`-separated statement that failed.
 */
export type RecoverySite = "term" | "apply" | "body";

const sites = new Set<RecoverySite>(["term", "apply"]);

export const setRecoverySites = (next: readonly RecoverySite[]): void => {
  sites.clear();
  for (const site of next) sites.add(site);
};

export const recoverySites = (): RecoverySite[] => [...sites];

/**
 * The masking rule under test, for a13a Q3.
 *
 * - `none`: no masking. a13 §9 predicts unbounded recursion; it is right.
 * - `value`: the running handler cannot catch its own failure.
 * - `key`: no handler is visible for the duration of any handler's call.
 */
export type RecoveryGuard = "none" | "value" | "key";

let guard: RecoveryGuard = "key";

export const setRecoveryGuard = (next: RecoveryGuard): void => {
  guard = next;
};

export const recoveryGuard = (): RecoveryGuard => guard;

/** How many times a handler was invoked, so double-firing is countable. */
let calls = 0;

export const recoveryCalls = (): number => calls;

export const resetRecovery = (): void => {
  calls = 0;
  running.clear();
  keyMasked = 0;
};

/**
 * Handlers currently on the stack.
 *
 * Module state, not a field on EvaluationScope: a handler's body runs in a
 * scope derived from the closure's own capture, which the failing term's scope
 * never reaches. A scope field set here would not be visible there. That is the
 * a13 §5 claim this spike breaks.
 */
const running = new Set<Frame>();
let keyMasked = 0;

/**
 * The refusal name a13 §7 hands the handler, with the sigil stripped.
 *
 * a13 §7 describes one vocabulary, `$!.…`. Two spellings in the trusted base
 * are outside it — `$error{$is-constant …}` and `$!invalid-argument-list …`,
 * which has no dot — so this is three patterns rather than one slice, and it
 * still has a fallthrough. It also has to look through a statement wrapper,
 * because a failing declaration reaches the reduce as the wrapper rather than
 * as the error frame.
 */
export const refusalName = (failure: Frame): string => {
  const source = FrameExpr.answeredValue(failure).toString();
  const dotted = source.match(/^\$!\.?([-\w]+)/);
  if (dotted) return dotted[1];
  const braced = source.match(/^\$error\{\$([-\w]+)/);
  if (braced) return braced[1];
  return source;
};

/**
 * Attempts a13's substitute-and-continue recovery for one failing value.
 *
 * Answers the substitute, or undefined when no handler answered and the
 * original failure must propagate unchanged.
 */
export const recover = (
  site: RecoverySite,
  failure: Frame,
  scope: EvaluationScope,
): Frame | undefined => {
  if (!sites.has(site)) return undefined;
  if (guard === "key" && keyMasked > 0) return undefined;

  const handler = FrameSymbol.for(RECOVERY_KEY).in(scope);
  if (!(handler instanceof FrameLazy)) return undefined;
  if (guard === "value" && running.has(template(handler))) return undefined;

  calls += 1;
  const answer = enter(
    handler,
    () => handler.call(new FrameString(refusalName(failure))),
  );

  // a13 §7a: nil declines. a13 §9: a handler that fails on its own declines
  // too, and the original failure is the one that survives.
  if (answer.is.void === true || answer.isFailedResult()) return undefined;
  return answer;
};

const enter = (handler: FrameLazy, body: () => Frame): Frame => {
  const key = template(handler);
  const reentered = running.has(key);
  running.add(key);
  keyMasked += 1;
  try {
    return body();
  } finally {
    keyMasked -= 1;
    if (!reentered) running.delete(key);
  }
};

/**
 * The shared closure body behind a per-read bound copy.
 *
 * `FrameSymbol.in` hands out a fresh bound copy for every read, so the handler
 * value is never the same object twice and identity masking has nothing stable
 * to compare. `FrameList.copy` reuses the term objects, so the first term of
 * the body is the same object across every copy of one source closure.
 */
const template = (handler: FrameLazy): Frame => {
  const body = handler.asArray();
  return body.length > 0 ? body[0] : handler;
};
