/**
 * The Demi class, loaded from HC for the fourth hash.
 *
 * `.####` answers a Demi, and a Demi is an HC class, `Demi` in `hc/demi.hc`,
 * not a native one (occurrence/figure 011.20). The frames package derives the
 * phase and loads natively but cannot run HC, so this module installs the
 * constructor it calls (`installDemiConstructor`).
 *
 * The class is read from the compiled-in bundle, not through a resource root,
 * so `.####` works in a bare `evaluate`, which has no root and imports nothing.
 * The file is evaluated the first time a Demi is constructed, once per
 * process, the way an import evaluates a testdoc: its example lines are
 * dropped and the first failure fails the whole. It runs in a namespace of its
 * own, with no host bindings and no root, so it can read nothing but the
 * global operators, and nothing a program declares can reach it. Its outcome
 * is kept, failure included, so it is never evaluated twice. A Demi requested
 * while the file is still loading is `$!.demi-prologue-reentrant`, because
 * the class cannot be defined by itself.
 *
 * What stays native is only what HC cannot say: reading `#`, `##` and `###`
 * in a fixed order with their absence and error rules, and checking that the
 * loads are whole. Everything a Demi does is in the HC source.
 *
 * @module
 */
import {
  EvaluationScope,
  Frame,
  FrameArray,
  FrameCount,
  FrameExpr,
  installDemiConstructor,
} from "../frames.ts";
import { HC_SOURCES } from "../bundle/hc-sources.ts";
import { evaluateSourceText } from "./resource-import.ts";

/** The bundled file that defines the class. */
export const DEMI_SOURCE = "hc/demi.hc";

/** The name the file declares the constructor under. */
export const DEMI_CLASS = "Demi";

let loaded: Frame | undefined;
let loading = false;

/**
 * Evaluates class source in a namespace of its own, with no host bindings and
 * no root, answering its `Demi` or the failure. Uncached: `demiClass` keeps
 * the one result the process uses.
 *
 * @param source The source text, or undefined when the bundle lacks it.
 * @returns The constructor, or an error.
 */
export function loadDemiClass(source: string | undefined): Frame {
  if (source === undefined) {
    return Frame.error(`$!.demi-prologue-missing ${DEMI_SOURCE}`);
  }
  const namespace = new FrameArray([]);
  const result = evaluateSourceText(source, EvaluationScope.root(namespace));
  if (result.isFailedResult() || result.observationError()) return result;
  const constructor = namespace.getOwn(DEMI_CLASS);
  return constructor.is.missing
    ? Frame.error(`$!.demi-prologue-missing ${DEMI_CLASS}`)
    : constructor;
}

/**
 * The `Demi` constructor closure, evaluated from the bundle on first use.
 *
 * @returns The constructor, or the error that loading it answered.
 */
export function demiClass(): Frame {
  if (loaded) return loaded;
  if (loading) return Frame.error("$!.demi-prologue-reentrant");
  loading = true;
  try {
    loaded = loadDemiClass(HC_SOURCES.get(DEMI_SOURCE));
  } finally {
    loading = false;
  }
  return loaded;
}

/**
 * Constructs a Demi with the HC class: `Demi [phase, left, right]`.
 *
 * @param phase 2 when even, 1 when odd.
 * @param left The left load.
 * @param right The right load.
 * @returns The new instance, or the class's failure.
 */
export function constructDemi(
  phase: FrameCount,
  left: FrameCount,
  right: FrameCount,
): Frame {
  const constructor = demiClass();
  if (constructor.isFailedResult() || constructor.observationError()) {
    return constructor;
  }
  const state = new FrameArray([phase, left, right]);
  return FrameExpr.answeredValue(constructor.call(state)).referent();
}

installDemiConstructor(constructDemi);
