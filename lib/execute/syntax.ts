/**
 * Generates HC's character-to-parser dispatch context.
 *
 * Every registered atom class supplies static `SIGIL_STARTS` metadata. During
 * reduction, a source character becomes a `FrameSymbol`; looking that symbol
 * up in `LexPipe` selects its lexical receiver. Sigilizer then routes the
 * receiver's `scan()` decisions until it emits one completed atom to
 * `ParsePipe`.
 *
 * This table performs only initial character dispatch. Atom-specific lexical
 * boundaries and transitions belong to the atom's lexical contract, while
 * `ParsePipe` is responsible only for aggregating completed frames.
 *
 * @module
 */
import * as frame from "../frames.ts";
import { type AtomFactory, Lex } from "./lex.ts";
import { LexRun, type RunFactory } from "./lex-run.ts";
import { terminals } from "./terminals.ts";

export const atomClasses: Array<AtomFactory> = [
  frame.FrameAlias,
  frame.FrameArg,
  frame.FrameBlob,
  frame.FrameBytes,
  frame.FrameComment,
  frame.FrameDoc,
  frame.FrameName,
  frame.FrameNote,
  frame.FrameNumber,
  frame.FrameOperator,
  frame.FrameString,
  frame.FrameStringEnd,
  frame.FrameSymbol,
  frame.FrameURI,
];
type LexFactory = (Atom: AtomFactory) => Lex;

const lexicalModes: Record<"atom" | "run", LexFactory> = {
  atom: (Atom) => new Lex(Atom),
  run: (Atom) => new LexRun(asRunFactory(Atom)),
};

function asRunFactory(Atom: AtomFactory): RunFactory {
  const candidate = Atom as Partial<RunFactory> & AtomFactory;
  if (
    typeof candidate.RUN_DELIMITER !== "string" ||
    typeof candidate.RUN_LABEL !== "string" ||
    typeof candidate.RUN_OPAQUE !== "boolean" ||
    typeof candidate.fromRun !== "function"
  ) {
    throw new Error(
      `Run-delimited Sigil requires RUN_DELIMITER, RUN_LABEL, RUN_OPAQUE, and fromRun: ${Atom.name}`,
    );
  }
  return candidate as RunFactory;
}

export function getSyntax(): frame.Context {
  const syntax: frame.Context = { ...terminals };
  for (const Klass of atomClasses) {
    for (const { key, mode } of Klass.SIGIL_STARTS) {
      if (mode === "push" || mode === "pop") {
        throw new Error(`Atom registered a structural Sigil mode: ${key}`);
      }
      if (syntax[key] !== undefined) {
        throw new Error(`Conflicting Sigil registration: ${key}`);
      }
      syntax[key] = lexicalModes[mode](Klass);
    }
  }

  return syntax;
}
