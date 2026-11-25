import { type DeclaredApplication, declaredChain, Frame } from "./frame.ts";
import { BoundMethod } from "./bound-method.ts";
import { methodEffect } from "./effect-marker.ts";
import { FrameCount } from "./frame-count.ts";
import type { FrameArray } from "./frame-array.ts";
import type { FrameLazy } from "./frame-lazy.ts";

/**
 * The declared protocol: the methods a user class declares to decide how its
 * instances behave where an aggregate otherwise has a fixed rule.
 *
 * An aggregate collects when applied, leaves an arithmetic operator to the
 * global operation, contributes its spelling to text, and observes its
 * elements. A class replaces one of these rules by declaring a method under
 * the rule's key:
 *
 * - `apply`, or `apply_` when it writes the receiver, for the application
 *   (#375);
 * - `+`, `-`, `*` or `/` for that operator (015.02);
 * - `toText` for the readable text (#398);
 * - `#` or `##` for the Count or Size observation (011.20).
 *
 * The method is found on the aggregate or its declared parents, the chain a
 * class's methods come from, and never in the scope around it. `FrameArray`
 * keeps the overrides, which ask this module.
 *
 * @module
 */

/** The keys an aggregate declares its own application under, mutating first. */
const APPLICATION_KEYS = ["apply_", "apply"] as const;

/**
 * The operators an aggregate may declare its own answer to (015.02).
 *
 * These are the ordinary binary arithmetic spellings. A class declares one
 * as a method under the operator's own name, `+`, `-`, `*` or `/`, the way
 * it declares `apply`, `#` or `toText`. The method takes the right operand
 * and answers the operation's result, so the class decides what the operator
 * means on its instances without any special case in the evaluator.
 */
const OPERATOR_KEYS: readonly string[] = [
  "+",
  "-",
  "*",
  "/",
];

/** The key an aggregate declares its readable text under (#398). */
const TEXT_KEY = "toText";

/**
 * The size operators an aggregate may declare its own answer to (011.20):
 * Count and Size. `.###` and `.####` are not among them: the raw Denum is
 * built from the Count and each element's Size, and `.####` reads its KD
 * coordinates, so a method named `###` or `####` is an ordinary property
 * the observers never run. The one Denum these cannot rebuild, a
 * constructed one, is recognized intrinsically (`fourth-hash.ts`).
 */
const OBSERVATION_KEYS: readonly string[] = [
  Frame.kCOUNT,
  Frame.kLEAVES,
];

/** Declared observations in progress, so one that reads itself fails. */
const observing = new Map<FrameArray, Set<string>>();

/**
 * How deeply declared observations may nest. A cycle through the same
 * receivers is caught exactly; one that builds a fresh receiver each step
 * is not, so nesting is bounded too, far above any real class's need.
 */
const OBSERVATION_DEPTH_LIMIT = 32;

/** Declared observations now running, across every receiver. */
let observationDepth = 0;

/**
 * A method declared under `key` on `receiver` or its declared parents.
 *
 * Never the scope around it, so a plain array keeps its default behavior
 * wherever it is written.
 */
function methodDeclaredBy(
  receiver: FrameArray,
  key: string,
): Frame | undefined {
  for (const frame of declaredChain(receiver)) {
    const local = frame.get_here(key);
    if (!local.is.missing) {
      return local.isClass("FrameLazy") ? local : undefined;
    }
  }
  return undefined;
}

/**
 * The method `receiver` declares as its own application (#375).
 *
 * Applying an aggregate collects, and a receiver that wants another rule
 * declares it as a method named `apply`, or `apply_` when the rule writes the
 * receiver. It is found on the aggregate or its declared parents, the same
 * chain a class's methods come from, and never in the scope around it, so a
 * plain array keeps collecting wherever it is written.
 */
export function applicationDeclaredBy(
  receiver: FrameArray,
): DeclaredApplication | undefined {
  for (const key of APPLICATION_KEYS) {
    const method = methodDeclaredBy(receiver, key);
    if (method) return { key, method };
  }
  return undefined;
}

/**
 * The method `receiver` declares for the operator `key`, bound to it as the
 * left operand, or undefined when it declares none (015.02).
 *
 * Found on the aggregate or its declared parents, the same class chain its
 * other methods come from, and never in the scope around it, so an operator
 * written inside a method body keeps its ordinary meaning rather than
 * recurring into the class that is running. The method runs immutably, like a
 * declared observation: a deposit answers a fresh instance, as a functional
 * update does, and leaves the left operand unchanged.
 */
export function operatorDeclaredBy(
  receiver: FrameArray,
  key: string,
): BoundMethod | undefined {
  if (!OPERATOR_KEYS.includes(key)) return undefined;
  const method = methodDeclaredBy(receiver, key);
  if (!method) return undefined;
  return new BoundMethod(
    method as FrameLazy,
    receiver,
    false,
    methodEffect(key),
  );
}

/**
 * What `receiver` contributes to text by declaration (#398), or undefined
 * when it declares no `toText`.
 *
 * Text contributes an aggregate's spelling, which reads back as the same
 * value but spells every declaration, methods included. An aggregate that
 * declares `toText`, on itself or a declared parent, contributes that
 * method's answer instead, the way one that declares `apply` decides its own
 * application. The printer never calls it, so a printed value still reads
 * back.
 */
export function textDeclaredBy(receiver: FrameArray): Frame | undefined {
  const method = methodDeclaredBy(receiver, TEXT_KEY);
  if (!method) return undefined;
  return new BoundMethod(
    method as FrameLazy,
    receiver,
    false,
    methodEffect(TEXT_KEY),
  ).call(Frame.nil);
}

/**
 * An aggregate observes its elements, so a class that keeps its state in
 * fields observes as its empty element list: Count 0 and Size 1. One that
 * declares a method named `#` or `##`, on itself or a declared parent,
 * answers that method's result instead, the way one that declares `apply`
 * decides its own application (011.20). Nothing declares one by default, so
 * every other aggregate observes exactly as before.
 *
 * The answer must be a Count, the kind both operators answer. Anything else
 * is `$!.declared-observation`, an error the method answered is answered as
 * it is, and a method that observes its own receiver the same way, directly
 * or through other declared observations, is `$!.cyclic-observation`.
 * Nesting deeper than `OBSERVATION_DEPTH_LIMIT`, as a method that observes
 * a fresh instance of its own class does, is `$!.observation-depth`.
 *
 * The method runs immutably, so it cannot write its receiver. It is still
 * code the class wrote: it runs on every observation, with no caching, and
 * may act on anything else it can reach, a mutable handle in scope
 * included. Observation is pure only for classes that keep it pure.
 *
 * @param receiver The aggregate observed.
 * @param key A size operator.
 * @returns The declared answer, or undefined when none is declared.
 */
export function observationDeclaredBy(
  receiver: FrameArray,
  key: string,
): Frame | undefined {
  if (!OBSERVATION_KEYS.includes(key)) return undefined;
  const method = methodDeclaredBy(receiver, key);
  if (!method) return undefined;
  const active = observing.get(receiver) ?? new Set<string>();
  if (active.has(key)) return Frame.error(`$!.cyclic-observation .${key}`);
  if (observationDepth >= OBSERVATION_DEPTH_LIMIT) {
    return Frame.error(`$!.observation-depth .${key}`);
  }
  active.add(key);
  observing.set(receiver, active);
  observationDepth++;
  let answer: Frame;
  try {
    answer = new BoundMethod(
      method as FrameLazy,
      receiver,
      false,
      methodEffect(key),
    ).call(Frame.nil).referent();
  } finally {
    observationDepth--;
    active.delete(key);
    if (active.size === 0) observing.delete(receiver);
  }
  const failure = answer.observationError();
  if (failure) return failure;
  const data = (answer as unknown as { data?: unknown }).data;
  const valid = answer instanceof FrameCount;
  return valid && typeof data === "bigint"
    ? answer
    : Frame.error(`$!.declared-observation .${key}`);
}

/**
 * Runs a declared application with the receiver it binds to.
 *
 * The effect axis decides writes, as it does for every method: `apply_`
 * reached mutably writes the receiver and answers it, and reached immutably
 * answers an updated copy. A step that answers nil leaves the receiver as it
 * was, the way an aggregate ignores a nil argument, so a reduce can skip an
 * element without losing what it accumulated.
 */
export function applyDeclared(
  bound: BoundMethod,
  argument: Frame,
  unchanged: Frame,
): Frame {
  const result = bound.call(argument);
  return result.is.void ? unchanged : result;
}
