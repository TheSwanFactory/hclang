/**
 * Bridge from the shipped Denum to the observer algebras (occurrence/figure
 * 007.41).
 *
 * FOIST 19a removed the old `.#%` public Count binding and the geometric
 * observer family. This retained historical experiment explicitly performs
 * the old modulo-Count binding in this isolated module, so its comparative
 * mathematical results remain reproducible without restoring removed HC
 * operators. Raw Count and loads themselves are still read from genuine HC
 * Denums. The experiment's alternating residual is now a local computation,
 * NOT the meaning of public `.###`.
 *
 * @module
 */
import { evaluate } from "../../lib/execute/evaluate.ts";
import { constructDenum } from "../../lib/execute/denum-prologue.ts";
import { HC_SOURCES } from "../../lib/bundle/hc-sources.ts";
import { Frame, FrameCount, FrameExpr } from "../../lib/frames.ts";

/** The historical experiment's local Count-binding result. */
export interface Bound {
  readonly ok: true;
  /** The bound Denum's Count C (`d.#`). */
  readonly count: bigint;
  /** Its C ordered nonnegative loads (`d.loads`). */
  readonly loads: bigint[];
  /** Native Size `d.##`, the total load. */
  readonly size: bigint;
  /** Historical alternating residual, computed locally (not via `.###`). */
  readonly residual: bigint;
  /** The Denum's printed text. */
  readonly text: string;
}

/** A refusal of the historical local binder or the evaluator. */
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
 * Reads Count, loads and Size from an HC Denum; alternating residual is local
 * to this historical experiment and no longer a native hash observation.
 */
export function readBound(denum: Frame): BindResult {
  const failure = failureOf(denum);
  if (failure) return { ok: false, error: failure };
  const count = wholeOf(denum.sizeFor(Frame.kCOUNT));
  const size = wholeOf(denum.sizeFor(Frame.kLEAVES));
  const loadFrames = denum.getOwn("loads").referent().elements();
  const loads = loadFrames.map(wholeOf);
  const residual = loads.every((x) => x !== undefined)
    ? (loads as bigint[]).reduce(
      (acc, x, i) => acc + (i % 2 === 0 ? x : -x),
      0n,
    )
    : undefined;
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
 * Retired `.#%` was a cyclic partition by Count, not a KD observer.
 * Preserve that historical experiment's exact arithmetic locally.
 */
function historicallyBind(count: bigint, loads: readonly bigint[]): BindResult {
  if (count === 0n) return { ok: false, error: "$!.denum-binding-zero-count" };
  if (count < 0n || count > 65536n) {
    return { ok: false, error: "$!.denum-binding-capacity" };
  }
  const bound = Array<bigint>(Number(count)).fill(0n);
  loads.forEach((x, i) => bound[i % Number(count)] += x);
  return readBound(constructDenum(
    new FrameCount(count),
    bound.map((x) => new FrameCount(x)),
  ));
}

/** Construct the genuine Denum, then apply the historical local binding. */
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
  return historicallyBind(count, loads);
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
 * statement answers an explicit Denum (for example `(Denum [2,[5,3]]).###`).
 */
export function bindFromSource(source: string): BindResult {
  return readBound(lastValue(source));
}

/**
 * The HC source `(Denum [C, [loads]]).###` placed after the bundled
 * `hc/denum.hc` class definition, for a bare evaluator that cannot import.
 */
export function bindingSource(
  count: bigint,
  loads: readonly bigint[],
): string {
  return `${denumClassSource()}\n(Denum [${count}, [${loads.join(", ")}]]).###`;
}

/**
 * Probes observer spellings in today's HC evaluator. Historical geometry
 * names (`##%` … `###%%%`) are unbound after FOIST 19a: these probes
 * deliberately return name-missing instead of historical geometric values.
 * The Denum is built once, bound as `$$.d`, and each name is read in HC
 * source, e.g. `[$$.d.##%, …]`. Historical geometry lives in the separate
 * TypeScript experiment.
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

/** Reads a raw Denum from bare HC source then applies local historical binding. */
export function bindWithBareSource(
  count: bigint,
  loads: readonly bigint[],
): BindResult {
  const read = bindFromSource(bindingSource(count, loads));
  return read.ok ? historicallyBind(read.count, read.loads) : read;
}
