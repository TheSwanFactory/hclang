/**
 * Bridge from the shipped Denum to the observer algebras (occurrence/figure
 * 007.41).
 *
 * The Count and loads an algebra consumes are read from a Denum that the real
 * `d.#%` Count binding produced. This module never reimplements the
 * `bj = Σ_{i mod C = j} ai` normalization: `bindWithHC` and `bindFromSource`
 * ask the shipped binding, and the tests compare the two routes.
 *
 * The native readings reported beside an algebra (`.#`, `.##`, `.###`) are
 * likewise read from the bound Denum with the real observers.
 *
 * @module
 */
import { evaluate } from "../../lib/execute/evaluate.ts";
import { constructDenum } from "../../lib/execute/denum-prologue.ts";
import { HC_SOURCES } from "../../lib/bundle/hc-sources.ts";
import { Frame, FrameCount, FrameExpr } from "../../lib/frames.ts";

/** What a successful `.#%` answered, with the native readings of the answer. */
export interface Bound {
  readonly ok: true;
  /** The bound Denum's Count C (`d.#`). */
  readonly count: bigint;
  /** Its C ordered nonnegative loads (`d.loads`). */
  readonly loads: bigint[];
  /** Native Size `d.##`, the total load. */
  readonly size: bigint;
  /** Native residual `d.###`, the alternating signed sum of the loads. */
  readonly residual: bigint;
  /** The Denum's printed text. */
  readonly text: string;
}

/** A refusal answered by the shipped binding or the evaluator. */
export interface BindRefusal {
  readonly ok: false;
  readonly error: string;
}

/** The outcome of binding a Denum. */
export type BindResult = Bound | BindRefusal;

/** The text of a Frame's failure, or undefined when it is not one. */
function failureOf(frame: Frame): string | undefined {
  const failure = frame.isFailedResult()
    ? frame
    : frame.observationError() ?? undefined;
  return failure ? `${failure}` : undefined;
}

/** Reads an exact whole number from a Frame's text, or refuses. */
function wholeOf(frame: Frame): bigint | undefined {
  const text = `${frame}`;
  return /^-?\d+$/.test(text) ? BigInt(text) : undefined;
}

/**
 * Reads Count, loads and the native observers from a Denum that `.#%` already
 * produced. The native `.##` and `.###` are asked of the same Frame.
 */
export function readBound(denum: Frame): BindResult {
  const failure = failureOf(denum);
  if (failure) return { ok: false, error: failure };
  const count = wholeOf(denum.sizeFor(Frame.kCOUNT));
  const size = wholeOf(denum.sizeFor(Frame.kLEAVES));
  const residual = wholeOf(denum.sizeFor(Frame.kRESIDUAL));
  const loadFrames = denum.getOwn("loads").referent().elements();
  const loads = loadFrames.map(wholeOf);
  if (
    count === undefined || size === undefined || residual === undefined ||
    loads.some((l) => l === undefined)
  ) {
    return { ok: false, error: `not a Denum: ${denum}` };
  }
  return {
    ok: true,
    count,
    loads: loads as bigint[],
    size,
    residual,
    text: `${denum.toText()}`,
  };
}

/**
 * Constructs `Denum [count, loads]` with the shipped TypeScript bridge and
 * binds it with the real `.#%`.
 */
export function bindWithHC(
  count: bigint,
  loads: readonly bigint[],
): BindResult {
  const denum = constructDenum(
    new FrameCount(count),
    loads.map((l) => new FrameCount(l)),
  );
  const failure = failureOf(denum);
  if (failure) return { ok: false, error: failure };
  return readBound(denum.sizeFor(Frame.kBIND));
}

/** The bundled `hc/denum.hc` without its shebang, so a bare source can use it. */
function denumClassSource(): string {
  const text = HC_SOURCES.get("hc/denum.hc");
  if (text === undefined) throw new Error("hc/denum.hc is not bundled");
  return text.replace(/^#!.*\n/, "");
}

/** The last value a bare source answers, unwrapped to the aggregate itself. */
function lastValue(source: string): Frame {
  let answer = FrameExpr.answeredValue(evaluate(source).at(-1)).referent();
  while (
    answer.getOwn("count").is.missing && answer.asArray().length > 1
  ) {
    answer = FrameExpr.answeredValue(answer.asArray().at(-1)!).referent();
  }
  return answer;
}

/**
 * Evaluates bare HC source, with no root and no host bindings, whose last
 * statement answers a bound Denum (for example `[5, 3, 7].####.#%`), and reads
 * the answer.
 */
export function bindFromSource(source: string): BindResult {
  return readBound(lastValue(source));
}

/**
 * The HC source `(Denum [C, [loads]]).#%` placed after the bundled
 * `hc/denum.hc` class definition, for a bare evaluator that cannot import.
 */
export function bindingSource(
  count: bigint,
  loads: readonly bigint[],
): string {
  return `${denumClassSource()}\n(Denum [${count}, [${loads.join(", ")}]]).#%`;
}

/**
 * Asks native geometric observers (`##%` … `###%%%`, 007.41b, 007.46) of
 * `Denum [count, loads]` from HC source in a bare evaluator, so the
 * experiment's TypeScript algebras can be checked against the HC bindings. The
 * Denum is built once by the shipped bridge and bound as `$$.d`; every reading
 * is dispatched by HC source, `[$$.d.##%, …]`.
 *
 * @returns One answer per observer, in order.
 */
export function observeFromSource(
  count: bigint,
  loads: readonly bigint[],
  observers: readonly string[],
): Frame[] {
  const d = constructDenum(
    new FrameCount(count),
    loads.map((l) => new FrameCount(l)),
  );
  const source = `[${observers.map((key) => `$$.d.${key}`).join(", ")}]`;
  // Boxed, so a list observation is not mistaken for a group of statements.
  return FrameExpr.answeredValue(evaluate(source, { d }).at(-1)).referent()
    .asArray();
}

/** Binds `Denum [count, loads]` entirely from HC source in a bare evaluator. */
export function bindWithBareSource(
  count: bigint,
  loads: readonly bigint[],
): BindResult {
  return bindFromSource(bindingSource(count, loads));
}
