/**
 * The Denum and CD classes, loaded from HC for the ranked hash.
 *
 * `x.#n` answers a CD, and both CD and the generic Denum are HC classes,
 * `CD` and `Denum` in `hc/denum.hc` (occurrence/figure 007.32, 007.35b). The
 * frames package derives the state natively but cannot run HC, so this module
 * installs the constructors it calls (`installDenumConstructors`), exactly as
 * `demi-prologue.ts` does for `.####`. The CD constructor builds every
 * answer; the generic one is installed so a generic Denum source can be
 * recognized and refused, never converted.
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

/** The names the file declares its two public constructors under. */
export const DENUM_CLASS = "Denum";
export const CD_CLASS = "CD";

/** Both constructor closures of the file, or the failure that loading gave. */
export type DenumClasses = { denum: Frame; cd: Frame } | Frame;

let loaded: DenumClasses | undefined;
let loading = false;

const failed = (frame: Frame): boolean =>
  frame.isFailedResult() || frame.observationError() !== undefined;

/**
 * Evaluates class source in a namespace of its own, answering its `Denum` and
 * `CD` constructors or the failure. Uncached: `denumClasses` keeps the one
 * result the process uses.
 *
 * @param source The source text, or undefined when the bundle lacks it.
 * @returns Both constructors, or an error.
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
  const cd = namespace.getOwn(CD_CLASS);
  if (cd.is.missing) {
    return Frame.error(`$!.denum-prologue-missing ${CD_CLASS}`);
  }
  return { denum, cd };
}

/**
 * The `Denum` and `CD` constructor closures, evaluated from the bundle on
 * first use.
 *
 * @returns The constructors, or the error that loading them answered.
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

function construct(
  which: "denum" | "cd",
  state: denum.Denum,
): Frame {
  const classes = denumClasses();
  if (classes instanceof Frame) return classes;
  const constructor = classes[which];
  const argument = new FrameArray([
    new FrameCount(state.count),
    new FrameArray(state.loads.map((load) => new FrameCount(load))),
  ]);
  return FrameExpr.answeredValue(constructor.call(argument)).referent();
}

/**
 * Constructs a generic Denum with the HC class: `Denum [count, loads]`.
 *
 * @param state The Count and loads, already admissible.
 * @returns The new instance, or the class's failure.
 */
export function constructDenum(state: denum.Denum): Frame {
  return construct("denum", state);
}

/**
 * Constructs an explicit CD with the HC class: `CD [count, loads]`.
 *
 * @param state The Count and loads, already admissible as a CD.
 * @returns The new instance, or the class's failure.
 */
export function constructCD(state: denum.Denum): Frame {
  return construct("cd", state);
}

installDenumConstructors({ cd: constructCD, denum: constructDenum });
