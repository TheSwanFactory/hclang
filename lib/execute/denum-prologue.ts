/**
 * The Denum class, loaded from HC for the Denum observers and operators.
 *
 * `.###` answers a raw Denum, and `.####` reads KD coordinates from one. A
 * Denum is an HC class, `Denum` in `hc/denum.hc`, not a native one
 * (occurrence/figure 011.20). The frames package derives the Count and loads
 * natively but cannot run HC, so this module installs the constructor it calls
 * (`installDenumConstructor`).
 *
 * The class is read from the compiled-in bundle, not through a resource root,
 * so `.###` works in a bare `evaluate`, which has no root and imports nothing.
 * The file is evaluated the first time a Denum is constructed, once per
 * process, the way an import evaluates a testdoc: its example lines are
 * dropped and the first failure fails the whole. It runs in a namespace of its
 * own, with no host bindings and no root, so it can read nothing but the
 * global operators, and nothing a program declares can reach it. Its outcome
 * is kept, failure included, so it is never evaluated twice. A Denum requested
 * while the file is still loading is `$!.denum-prologue-reentrant`, because
 * the class cannot be defined by itself.
 *
 * What stays native is reading a source's Count `#` and each child's Size `##`
 * in a fixed order, with their absence and error rules, checking that the
 * loads are whole, and the KD arithmetic of `.####`, unary `-` and `&|&`
 * (`lib/frames/fourth-hash.ts`). The Denum's own methods are in the HC source.
 *
 * @module
 */
import {
  Frame,
  FrameArray,
  FrameCount,
  FrameExpr,
  installDenumConstructor,
} from "../frames.ts";
import {
  classOnce,
  type ClassPrologue,
  loadClassNames,
} from "./class-prologue.ts";

/** The bundled file that defines the class. */
export const DENUM_SOURCE = "hc/denum.hc";

/** The file, the constructor's name and the error prefix (`class-prologue.ts`). */
const DENUM_PROLOGUE: ClassPrologue = {
  file: DENUM_SOURCE,
  names: ["Denum"],
  prefix: "denum-prologue",
};

/** The one load of the class this process uses. */
const denumOnce = classOnce(DENUM_PROLOGUE);

/**
 * The constructor out of a load's answer.
 *
 * @param loaded The declared names' values, or the failure.
 * @returns The constructor, or the failure.
 */
function constructorOf(loaded: Frame[] | Frame): Frame {
  return Array.isArray(loaded) ? loaded[0] : loaded;
}

/**
 * Evaluates class source in a namespace of its own, with no host bindings and
 * no root, answering its `Denum` or the failure. Uncached: `denumClass` keeps
 * the one result the process uses.
 *
 * @param source The source text, or undefined when the bundle lacks it.
 * @returns The constructor, or an error.
 */
export function loadDenumClass(source: string | undefined): Frame {
  return constructorOf(loadClassNames(DENUM_PROLOGUE, source));
}

/**
 * The `Denum` constructor closure, evaluated from the bundle on first use.
 *
 * @returns The constructor, or the error that loading it answered.
 */
export function denumClass(): Frame {
  return constructorOf(denumOnce());
}

/**
 * Constructs a Denum of any arity with the HC class: `Denum [count, loads]`.
 * Every number of loads, one or more, is the same class (007.27, 007.40).
 *
 * @param count The full application Count.
 * @param loads The ordered channel loads.
 * @returns The new instance, or the class's failure.
 */
export function constructDenum(
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

installDenumConstructor(constructDenum);
