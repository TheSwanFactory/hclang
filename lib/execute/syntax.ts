/**
 * Generates HC's character-to-parser dispatch context.
 *
 * Every registered atom class supplies a sample whose `string_start()` is the
 * lookup key for its configured parser. During reduction, a source character
 * becomes a `FrameSymbol`; looking that symbol up in `LexPipe` selects that
 * parser. Most atoms use `Lex(Factory)`; atoms with a registered parser use it
 * through the same lookup. The selected lexer consumes the remaining characters
 * and emits one completed atom to `ParsePipe`.
 *
 * This table performs only initial character dispatch. Atom-specific lexical
 * boundaries and transitions belong to the atom's lexical contract, while
 * `ParsePipe` is responsible only for aggregating completed frames.
 *
 * @module
 */
import * as frame from "../frames.ts";
import { type AtomFactory, Lex } from "./lex.ts";
import { LexDoc } from "./lex-doc.ts";
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
  frame.FrameSymbol,
];
type LexFactory = (Atom: AtomFactory) => Lex;

const lexicalModes: Record<"atom" | "document", LexFactory> = {
  atom: (Atom) => new Lex(Atom),
  document: () => new LexDoc(),
};

export function getSyntax(): frame.Context {
  const syntax: frame.Context = { ...terminals };
  atomClasses.forEach((Klass: AtomFactory) => {
    const sample: frame.FrameAtom = new Klass("");
    sample.sigilStarts().forEach(({ key, mode }) => {
      if (mode === "push" || mode === "pop") {
        throw new Error(`Atom registered a structural Sigil mode: ${key}`);
      }
      if (syntax[key] !== undefined) {
        throw new Error(`Conflicting Sigil registration: ${key}`);
      }
      syntax[key] = lexicalModes[mode](Klass);
    });
    return true;
  });

  return syntax;
}
