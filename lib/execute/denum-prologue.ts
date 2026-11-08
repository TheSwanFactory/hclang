/**
 * The Denum class, loaded from HC for the ranked hash.
 *
 * `x.#n` answers a Denum, and the only public constructor is the HC class
 * `Denum` in `hc/denum.hc` (occurrence/figure 007.32, 007.36). The CD algebra
 * is a view derived by `d.cd ()`, not a second constructor. The frames package
 * derives the state natively but cannot run HC, so this module installs what
 * it calls (`installDenumConstructors`), exactly as `demi-prologue.ts` does for
 * `.####`. The `Denum` constructor builds every answer; the internal view
 * derivation `view-of` is installed only so a view source can be recognized
 * and refused. It is not a constructor of retained state and is never
 * exported.
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
  installDenumConstructors,
} from "../frames.ts";
import { HC_SOURCES } from "../bundle/hc-sources.ts";
import { evaluateSourceText } from "./resource-import.ts";

/** The bundled file that defines the class. */
export const DENUM_SOURCE = "hc/denum.hc";

/** The name the file declares its one public constructor under. */
export const DENUM_CLASS = "Denum";
/** The internal view derivation: `view-of d` is `d.cd ()`. Not a constructor. */
export const VIEW_FACTORY = "view-of";

/** The closures of the file the ranked hash uses, or the failure it gave. */
export type DenumClasses = { denum: Frame; view: Frame } | Frame;

let loaded: DenumClasses | undefined;
let loading = false;

const failed = (frame: Frame): boolean =>
  frame.isFailedResult() || frame.observationError() !== undefined;

/**
 * Evaluates class source in a namespace of its own, answering its `Denum`
 * constructor and `view-of` derivation or the failure. Uncached: `denumClasses` keeps the one
 * result the process uses.
 *
 * @param source The source text, or undefined when the bundle lacks it.
 * @returns The `Denum` constructor and the view derivation, or an error.
 */
export function loadDenumClasses(source: string | undefined): DenumClasses {
  if (source === undefined) {
    return Frame.error(`$!.denum-prologue-missing ${DENUM_SOURCE}`);
  }
  const namespace = new FrameArray([]);
  const result = evaluateSourceText(source, EvaluationScope.root(namespace));
  if (failed(result)) return result;
  const denum = namespace.getOwn(DENUM_CLASS);
  if (denum.is.missing) {
    return Frame.error(`$!.denum-prologue-missing ${DENUM_CLASS}`);
  }
  const view = namespace.getOwn(VIEW_FACTORY);
  if (view.is.missing) {
    return Frame.error(`$!.denum-prologue-missing ${VIEW_FACTORY}`);
  }
  return { denum, view };
}

/**
 * The `Denum` constructor and `view-of` closures, evaluated from the bundle on
 * first use.
 *
 * @returns The closures, or the error that loading them answered.
 */
export function denumClasses(): DenumClasses {
  if (loaded) return loaded;
  if (loading) return Frame.error("$!.denum-prologue-reentrant");
  loading = true;
  try {
    loaded = loadDenumClasses(HC_SOURCES.get(DENUM_SOURCE));
  } finally {
    loading = false;
  }
  return loaded;
}

const stateArgument = (state: denum.Denum): Frame =>
  new FrameArray([
    new FrameCount(state.count),
    new FrameArray(state.loads.map((load) => new FrameCount(load))),
  ]);

/**
 * Constructs a Denum with the HC class: `Denum [count, loads]`.
 *
 * @param state The Count and loads, already admissible.
 * @returns The new instance, or the class's failure.
 */
export function constructDenum(state: denum.Denum): Frame {
  const classes = denumClasses();
  if (classes instanceof Frame) return classes;
  return FrameExpr.answeredValue(classes.denum.call(stateArgument(state)))
    .referent();
}

/**
 * Derives the CD view of the Denum the state builds, as `d.cd ()` does. Only
 * the ranked hash's recognition of a view source uses it.
 *
 * @param state The Count and loads, already admissible.
 * @returns The view instance, or the class's failure.
 */
function deriveView(state: denum.Denum): Frame {
  const classes = denumClasses();
  if (classes instanceof Frame) return classes;
  const source = constructDenum(state);
  if (source.isFailedResult() || source.observationError()) return source;
  return FrameExpr.answeredValue(classes.view.call(source)).referent();
}

installDenumConstructors({ denum: constructDenum, view: deriveView });
