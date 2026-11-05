/**
 * The RotorRouter class, loaded from HC for list division.
 *
 * Dividing a list, `xs ./ n`, deals its elements into n channels and answers
 * them as a `RotorRouter`, the HC class in `hc/rotor-router.hc`, so that the
 * channels stay channels and a further division reads them breadth-first
 * (occurrence/figure 007.27c). The ops package deals natively but cannot run
 * HC, so this module installs the constructor it calls
 * (`installDivisionCarrier`).
 *
 * As with the Demi class (`demi-prologue.ts`), the class is read from the
 * compiled-in bundle, evaluated once per process on first use, in a namespace
 * of its own with no host bindings and no root, and its outcome is kept,
 * failure included. A division requested while the file is still loading is
 * `$!.router-prologue-reentrant`.
 *
 * @module
 */
import { EvaluationScope, Frame, FrameArray, FrameExpr } from "../frames.ts";
import { installDivisionCarrier } from "../ops/math.ts";
import { HC_SOURCES } from "../bundle/hc-sources.ts";
import { evaluateSourceText } from "./resource-import.ts";

/** The bundled file that defines the class. */
export const ROUTER_SOURCE = "hc/rotor-router.hc";

/** The name the file declares the constructor under. */
export const ROUTER_CLASS = "RotorRouter";

let loaded: Frame | undefined;
let loading = false;

/**
 * Evaluates class source in a namespace of its own, answering its
 * `RotorRouter` or the failure. Uncached: `routerClass` keeps the one result.
 *
 * @param source The source text, or undefined when the bundle lacks it.
 * @returns The constructor, or an error.
 */
export function loadRouterClass(source: string | undefined): Frame {
  if (source === undefined) {
    return Frame.error(`$!.router-prologue-missing ${ROUTER_SOURCE}`);
  }
  const namespace = new FrameArray([]);
  const result = evaluateSourceText(source, EvaluationScope.root(namespace));
  if (result.isFailedResult() || result.observationError()) return result;
  const constructor = namespace.getOwn(ROUTER_CLASS);
  return constructor.is.missing
    ? Frame.error(`$!.router-prologue-missing ${ROUTER_CLASS}`)
    : constructor;
}

/**
 * The `RotorRouter` constructor closure, evaluated from the bundle on first
 * use.
 *
 * @returns The constructor, or the error that loading it answered.
 */
export function routerClass(): Frame {
  if (loaded) return loaded;
  if (loading) return Frame.error("$!.router-prologue-reentrant");
  loading = true;
  try {
    loaded = loadRouterClass(HC_SOURCES.get(ROUTER_SOURCE));
  } finally {
    loading = false;
  }
  return loaded;
}

/**
 * Constructs a router with the HC class: `RotorRouter [ch0, …, chk−1]`.
 *
 * @param channels The channel arrays, in order.
 * @returns The new instance, or the class's failure.
 */
export function constructRouter(channels: FrameArray): Frame {
  const constructor = routerClass();
  if (constructor.isFailedResult() || constructor.observationError()) {
    return constructor;
  }
  return FrameExpr.answeredValue(constructor.call(channels)).referent();
}

installDivisionCarrier(constructRouter);
