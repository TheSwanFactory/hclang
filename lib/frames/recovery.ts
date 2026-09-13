import { Frame } from "./frame.ts";
import { FrameExpr } from "./frame-expr.ts";
import { FrameLazy } from "./frame-lazy.ts";
import { FrameString } from "./frame-string.ts";
import { FrameSymbol } from "./frame-symbol.ts";
import type { EvaluationScope } from "./evaluation-scope.ts";

/**
 * SPIKE INSTRUMENTATION for a13a, extended by a13c. Throwaway.
 *
 * a13 spells the recovery property `.$:`, which does not lex today (a13 §10).
 * The spike uses an ordinary name so the spelling decision cannot gate the
 * mechanism, per a13a §3.
 *
 * a13c changes four things and nothing else:
 *   - the guard defaults to `value` (a13 §9's ruling) rather than `key`;
 *   - the depth counter a13b Q2 reported is gone (a13c §2);
 *   - §6a's once-per-handler-per-failure rule exists and is on by default;
 *   - handler identity is a switch, because the two candidate notions of
 *     "the closure template" do not agree (a13c A1/A4).
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
 * The masking rule under test, for a13a Q3 and a13c §1.
 *
 * - `none`: no masking. a13 §9 predicts unbounded recursion; it is right.
 * - `value`: the running handler cannot catch its own failure. a13 §9's ruling,
 *   and a13c's default.
 * - `key`: no handler is visible for the duration of any handler's call.
 *
 * a13b Q2 described the guard as "a set of running handler templates plus a
 * depth counter". The counter was `keyMasked`, and it was read on the `key`
 * branch only — under `value` masking it never had any effect. It is gone: key
 * masking asks the same set whether anything at all is running.
 */
export type RecoveryGuard = "none" | "value" | "key";

let guard: RecoveryGuard = "value";

export const setRecoveryGuard = (next: RecoveryGuard): void => {
  guard = next;
};

export const recoveryGuard = (): RecoveryGuard => guard;

/**
 * What counts as "the same handler", for masking (§9) and for §6a alike.
 *
 * - `first-term`: a13b Q3's proxy — the first term object of the closure body,
 *   on the grounds that `FrameList.copy` reuses term objects. Atom classes
 *   intern their instances, so this collides across unrelated handlers.
 * - `object`: the bound closure object itself. `FrameLazy.bind` answers `this`
 *   when the value is already bound, so a declared handler read twice is the
 *   same object twice, which a13 §9 and a13b Q3 both say it is not.
 */
export type RecoveryIdentity = "first-term" | "object";

let identity: RecoveryIdentity = "first-term";

export const setRecoveryIdentity = (next: RecoveryIdentity): void => {
  identity = next;
};

export const recoveryIdentity = (): RecoveryIdentity => identity;

/**
 * §6a's identity, separately settable.
 *
 * a13 §6a says the two rulings share one notion of handler identity. A4 shows
 * they cannot: the identity coarse enough to bound §9's recursion is too coarse
 * for §6a's bookkeeping, which then discards a live recovery. `undefined` means
 * "whatever §9 is using", which is a13 as written.
 */
let onceIdentity: RecoveryIdentity | undefined = undefined;

export const setRecoveryOnceIdentity = (
  next: RecoveryIdentity | undefined,
): void => {
  onceIdentity = next;
};

/** a13 §6a: offer a failure to each distinct handler at most once. */
let onceRule = true;

export const setRecoveryOnce = (next: boolean): void => {
  onceRule = next;
};

export const recoveryOnce = (): boolean => onceRule;

/**
 * A measurement tripwire, not a guard.
 *
 * A divergence that grows the stack announces itself as a RangeError, but one
 * that does not — an unbounded number of *sibling* handler calls — would simply
 * hang. This throws instead, so an attack that fails to terminate is reported
 * rather than waited for. It is never consulted before the guard, so it cannot
 * be mistaken for part of the bound.
 */
export class RecoveryRunaway extends Error {}

let tripwire = 0;

export const setRecoveryTripwire = (limit: number): void => {
  tripwire = limit;
};

/** How many times a handler was invoked, so double-firing is countable. */
let calls = 0;
let depth = 0;
let maxDepth = 0;
const identities = new Set<unknown>();
const trace: string[] = [];
let tracing = false;

export const recoveryCalls = (): number => calls;

/** The deepest nesting of handler bodies inside handler bodies. */
export const recoveryMaxDepth = (): number => maxDepth;

/** How many distinct handler identities were invoked. */
export const recoveryIdentityCount = (): number => identities.size;

export const setRecoveryTrace = (on: boolean): void => {
  tracing = on;
};

export const recoveryTrace = (): readonly string[] => trace;

export const resetRecovery = (): void => {
  calls = 0;
  depth = 0;
  maxDepth = 0;
  identities.clear();
  trace.length = 0;
  running.clear();
  offered = new WeakMap();
};

/**
 * Handlers currently on the stack.
 *
 * Module state, not a field on EvaluationScope: a handler's body runs in a
 * scope derived from the closure's own capture, which the failing term's scope
 * never reaches. A scope field set here would not be visible there. That is the
 * a13 §5 claim this spike breaks.
 */
const running = new Set<unknown>();

/**
 * §6a's bookkeeping: which handlers have already been offered which failure.
 *
 * Keyed by the failure frame itself, so "the same failure" means the same
 * object. Weak, because a failure that is no longer reachable can never be
 * offered again.
 */
let offered = new WeakMap<Frame, Set<unknown>>();

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
  if (guard === "key" && running.size > 0) return undefined;

  const handler = FrameSymbol.for(RECOVERY_KEY).in(scope);
  if (!(handler instanceof FrameLazy)) return undefined;

  const key = template(handler, identity);
  if (guard === "value" && running.has(key)) return undefined;

  // a13 §6a: each distinct handler sees a given failure once. Identity is the
  // same notion masking uses, which is what makes the two interact.
  const subject = FrameExpr.answeredValue(failure);
  if (onceRule) {
    const offerKey = onceIdentity === undefined
      ? key
      : template(handler, onceIdentity);
    const seen = offered.get(subject);
    if (seen?.has(offerKey)) return undefined;
    if (seen) seen.add(offerKey);
    else offered.set(subject, new Set([offerKey]));
  }

  calls += 1;
  identities.add(key);
  if (tripwire > 0 && calls > tripwire) {
    throw new RecoveryRunaway(
      `handler invoked ${calls} times for one source unit`,
    );
  }
  const answer = enter(
    key,
    () => handler.call(new FrameString(refusalName(failure))),
  );

  // a13 §7a: nil declines. a13 §9: a handler that fails on its own declines
  // too, and the original failure is the one that survives.
  if (answer.is.void === true || answer.isFailedResult()) return undefined;
  return answer;
};

const enter = (key: unknown, body: () => Frame): Frame => {
  const reentered = running.has(key);
  running.add(key);
  depth += 1;
  if (depth > maxDepth) maxDepth = depth;
  if (tracing) trace.push(`${" ".repeat(depth - 1)}enter ${label(key)}`);
  try {
    return body();
  } finally {
    depth -= 1;
    if (!reentered) running.delete(key);
    if (tracing) trace.push(`${" ".repeat(depth)}leave ${label(key)}`);
  }
};

const label = (key: unknown): string =>
  key instanceof Frame ? `${key.id} ${key.toString()}` : String(key);

/**
 * What "the same handler" means, under whichever identity is selected.
 *
 * `first-term` is a13b Q3's proxy: `FrameList.copy` reuses the term objects, so
 * the first term of the body is the same object across every copy of one source
 * closure. It is also the same object across every *other* closure whose body
 * starts with the same atom, because FrameArg and FrameSymbol intern.
 *
 * `object` is the closure itself, which is stable for a different reason: a
 * declared handler is bound when its declaration is evaluated, and
 * `FrameLazy.bind` answers `this` for an already-bound closure, so the read
 * does not copy.
 */
const template = (
  handler: FrameLazy,
  mode: RecoveryIdentity = identity,
): unknown => {
  if (mode === "object") return handler;
  const body = handler.asArray();
  return body.length > 0 ? body[0] : handler;
};
