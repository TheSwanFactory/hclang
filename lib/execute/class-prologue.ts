/**
 * Loads an HC class that a native module needs, from the compiled-in bundle.
 *
 * The Denum (`denum-prologue.ts`) and the RotorRouter (`router-prologue.ts`)
 * are HC classes that native observers and operators construct. Each is read
 * from the bundle, not through a resource root, so it works in a bare
 * `evaluate`, which has no root and imports nothing. The file is evaluated the
 * first time it is needed, once per process, the way an import evaluates a
 * testdoc: its example lines are dropped and the first failure fails the
 * whole. It runs in a namespace of its own, with no host bindings and no root,
 * so it can read nothing but the global operators, and nothing a program
 * declares can reach it. Its outcome is kept, failure included, so it is never
 * evaluated twice. A request made while the file is still loading answers
 * `$!.<prefix>-reentrant`, because a class cannot be defined by itself.
 *
 * @module
 */
import { EvaluationScope, Frame, FrameArray } from "../frames.ts";
import { HC_SOURCES } from "../bundle/hc-sources.ts";
import { evaluateSourceText } from "./resource-import.ts";

/** A bundled HC file and the names a native module reads from it. */
export interface ClassPrologue {
  /** The bundled file that defines the class, such as `hc/denum.hc`. */
  readonly file: string;
  /** The names the file declares, read in this order. */
  readonly names: readonly string[];
  /** The error prefix, such as `denum-prologue`. */
  readonly prefix: string;
}

/**
 * Evaluates class source in a namespace of its own, with no host bindings and
 * no root, answering the declared names in order or the failure. Uncached:
 * `classOnce` keeps the one result the process uses.
 *
 * @param prologue The file, the names to read and the error prefix.
 * @param source The source text, or undefined when the bundle lacks it.
 * @returns The declared names' values in order, or an error.
 */
export function loadClassNames(
  prologue: ClassPrologue,
  source: string | undefined,
): Frame[] | Frame {
  if (source === undefined) {
    return Frame.error(`$!.${prologue.prefix}-missing ${prologue.file}`);
  }
  const namespace = new FrameArray([]);
  const result = evaluateSourceText(source, EvaluationScope.root(namespace));
  if (result.isFailedResult() || result.observationError()) return result;
  const values: Frame[] = [];
  for (const name of prologue.names) {
    const value = namespace.getOwn(name);
    if (value.is.missing) {
      return Frame.error(`$!.${prologue.prefix}-missing ${name}`);
    }
    values.push(value);
  }
  return values;
}

/**
 * Answers a loader that evaluates the class from the bundle on first use and
 * keeps the outcome, failure included.
 *
 * @param prologue The file, the names to read and the error prefix.
 * @returns The loader: the declared names' values in order, the error loading
 *   answered, or `$!.<prefix>-reentrant` while the file is loading.
 */
export function classOnce(prologue: ClassPrologue): () => Frame[] | Frame {
  let loaded: Frame[] | Frame | undefined;
  let loading = false;
  return () => {
    if (loaded) return loaded;
    if (loading) return Frame.error(`$!.${prologue.prefix}-reentrant`);
    loading = true;
    try {
      loaded = loadClassNames(prologue, HC_SOURCES.get(prologue.file));
    } finally {
      loading = false;
    }
    return loaded;
  };
}
