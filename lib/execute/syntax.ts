import * as frame from "../frames.ts";
import { LexBytes } from "./lex-bytes.ts";
import {
  type AtomFactory,
  type BytesFactory,
  Lex,
  type UnionFactory,
} from "./lex.ts";
import { terminals } from "./terminals.ts";

export const _syntax: frame.Context = { ...terminals };
export const atomClasses: Array<UnionFactory> = [
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
  frame.FrameBytes,
];

let has_syntax = false;
/**
 * Retrieves the syntax context. If the syntax has already been initialized,
 * it returns the existing syntax context. Otherwise, it initializes the syntax
 * context by iterating over the `atomClasses` array, creating a new instance
 * of each class, and adding it to the `_syntax` object.
 *
 * @returns {frame.Context} The syntax context.
 */
export function getSyntax(): frame.Context {
  if (has_syntax === true) {
    return _syntax;
  }
  has_syntax = true;
  atomClasses.forEach((UnionKlass: UnionFactory) => {
    if (UnionKlass === frame.FrameBytes) {
      const Klass = UnionKlass as BytesFactory;
      const sample: frame.FrameAtom = new Klass([]);
      const key = sample.string_start();
      const lexee = new LexBytes(0);
      _syntax[key] = lexee;
      return true;
    }
    const Klass = UnionKlass as AtomFactory;
    const sample: frame.FrameAtom = new Klass("");
    const key = sample.string_start();
    const lexee = new Lex(Klass);
    _syntax[key] = lexee;
    return true;
  });

  return _syntax;
}
