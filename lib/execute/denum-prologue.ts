/**
 * The Denum class, loaded from HC for the fourth hash.
 *
 * `.####` answers a Denum, and a Denum is an HC class, `Denum` in `hc/denum.hc`,
 * not a native one (occurrence/figure 011.20). The frames package derives the
 * Count and loads natively but cannot run HC, so this module installs the
 * constructor it calls (`installDenumConstructor`).
 *
 * The class is read from the compiled-in bundle, not through a resource root,
 * so `.####` works in a bare `evaluate`, which has no root and imports nothing.
 * The file is evaluated the first time a Denum is constructed, once per
 * process, the way an import evaluates a testdoc: its example lines are
 * dropped and the first failure fails the whole. It runs in a namespace of its
 * own, with no host bindings and no root, so it can read nothing but the
 * global operators, and nothing a program declares can reach it. Its outcome
 * is kept, failure included, so it is never evaluated twice. A Denum requested
 * while the file is still loading is `$!.denum-prologue-reentrant`, because
 * the class cannot be defined by itself.
 *
 * What stays native is only what HC cannot say: reading `#`, `##` and `###`
 * in a fixed order with their absence and error rules, and checking that the
 * loads are whole. Everything a Denum does is in the HC source.
 *
 * @module
 */
import {
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
 * Evaluates class source in a namespace of its own, with no host bindings and
 * no root, answering its `Denum` or the failure. Uncached: `denumClass` keeps
 * the one result the process uses.
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
 * Constructs a Denum of any arity with the HC class: `Denum [count, loads]`.
 * Two loads give the binary Denum, the same instance `Denum [count, left,
 * right]` builds; any other nonzero number gives the channel Denum (007.27).
 *
 * @param count The full application Count.
 * @param loads The ordered channel loads.
 * @returns The new instance, or the class's failure.
 */
export function constructDenumLoads(
  count: FrameCount,
  loads: readonly FrameCount[],
): Frame {
  const constructor = denumClass();
  if (constructor.isFailedResult() || constructor.observationError()) {
    return constructor;
  }
  const state = new FrameArray([count, new FrameArray([...loads])]);
  return FrameExpr.answeredValue(constructor.call(state)).referent();
}

/**
 * Constructs a binary Denum with the HC class: `Denum [count, left, right]`.
 *
 * @param count The full application Count; the Denum derives its phase from it.
 * @param left The left load.
 * @param right The right load.
 * @returns The new instance, or the class's failure.
 */
export function constructDenum(
  count: FrameCount,
  left: FrameCount,
  right: FrameCount,
): Frame {
  return constructDenumLoads(count, [left, right]);
}

installDenumConstructor(constructDenumLoads);
