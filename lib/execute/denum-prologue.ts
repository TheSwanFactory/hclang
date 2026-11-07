/**
 * The Denum class, loaded from HC for the ranked hash.
 *
 * `x.#n` answers a Denum, and a Denum is an HC class, `Denum` in
 * `hc/denum.hc` (occurrence/figure 007.32). The frames package derives the
 * state natively but cannot run HC, so this module installs the constructor it
 * calls (`installDenumConstructor`), exactly as `demi-prologue.ts` does for
 * `.####`.
 *
 * The class is read from the compiled-in bundle, not through a resource root,
 * so `.#n` works in a bare `evaluate`, which has no root and imports nothing.
 * The file is evaluated the first time a Denum is constructed, once per
 * process: its example lines are dropped and the first failure fails the whole.
 * It runs in a namespace of its own, with no host bindings and no root, so it
 * can read nothing but the global operators, among them the pure
 * `denum-engine`, and nothing a program declares can reach it. Its outcome is
 * kept, failure included, so it is never evaluated twice. A Denum requested
 * while the file is still loading is `$!.denum-prologue-reentrant`.
 *
 * @module
 */
import {
  type denum,
  EvaluationScope,
  Frame,
  FrameArray,
  FrameCount,
  FrameExpr,
  installDenumConstructor,
} from "../frames.ts";
import { HC_SOURCES } from "../bundle/hc-sources.ts";
import { evaluateSourceText } from "./resource-import.ts";

/** The bundled file that defines the class. */
export const DENUM_SOURCE = "hc/denum.hc";

/** The name the file declares the constructor under. */
export const DENUM_CLASS = "Denum";

let loaded: Frame | undefined;
let loading = false;

/**
 * Evaluates class source in a namespace of its own, answering its `Denum` or
 * the failure. Uncached: `denumClass` keeps the one result the process uses.
 *
 * @param source The source text, or undefined when the bundle lacks it.
 * @returns The constructor, or an error.
 */
export function loadDenumClass(source: string | undefined): Frame {
  if (source === undefined) {
    return Frame.error(`$!.denum-prologue-missing ${DENUM_SOURCE}`);
  }
  const namespace = new FrameArray([]);
  const result = evaluateSourceText(source, EvaluationScope.root(namespace));
  if (result.isFailedResult() || result.observationError()) return result;
  const constructor = namespace.getOwn(DENUM_CLASS);
  return constructor.is.missing
    ? Frame.error(`$!.denum-prologue-missing ${DENUM_CLASS}`)
    : constructor;
}

/**
 * The `Denum` constructor closure, evaluated from the bundle on first use.
 *
 * @returns The constructor, or the error that loading it answered.
 */
export function denumClass(): Frame {
  if (loaded) return loaded;
  if (loading) return Frame.error("$!.denum-prologue-reentrant");
  loading = true;
  try {
    loaded = loadDenumClass(HC_SOURCES.get(DENUM_SOURCE));
  } finally {
    loading = false;
  }
  return loaded;
}

/**
 * Constructs a Denum with the HC class: `Denum [rank, count, loads]`.
 *
 * @param state The rank, Count and loads, already admissible.
 * @returns The new instance, or the class's failure.
 */
export function constructDenum(state: denum.Denum): Frame {
  const constructor = denumClass();
  if (constructor.isFailedResult() || constructor.observationError()) {
    return constructor;
  }
  const argument = new FrameArray([
    new FrameCount(BigInt(state.rank)),
    new FrameCount(state.count),
    new FrameArray(state.loads.map((load) => new FrameCount(load))),
  ]);
  return FrameExpr.answeredValue(constructor.call(argument)).referent();
}

installDenumConstructor(constructDenum);
