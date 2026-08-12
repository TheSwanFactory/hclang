/**
 * Generates HC's character-to-parser dispatch context.
 *
 * Every registered atom class supplies a sample whose `string_start()` is the
 * lookup key for a generic `Lex(Factory)`. During reduction, a source character
 * becomes a `FrameSymbol`; looking that symbol up in `LexPipe` selects the
 * configured atom parser. The selected lexer consumes the remaining characters
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
import { terminals } from "./terminals.ts";

export const atomClasses: Array<AtomFactory> = [
  frame.FrameAlias,
  frame.FrameArg,
  frame.FrameBlob,
  frame.FrameComment,
  frame.FrameDoc,
  frame.FrameName,
  frame.FrameNote,
  frame.FrameNumber,
  frame.FrameOperator,
  frame.FrameString,
  frame.FrameSymbol,
];
//   FIXME: frame.FrameBytes not of type AtomFactory

export function getSyntax(): frame.Context {
  const syntax: frame.Context = { ...terminals };
  atomClasses.forEach((Klass: AtomFactory) => {
    const sample: frame.FrameAtom = new Klass("");
    const key = sample.string_start();
    const lexee = new Lex(Klass);
    syntax[key] = lexee;
    return true;
  });

  return syntax;
}
