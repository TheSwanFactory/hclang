import * as frame from "../frames.ts";
import { LexBytes } from "./lex-bytes.ts";
import { type AtomFactory, Lex } from "./lex.ts";
import { terminals } from "./terminals.ts";

export type AtomFactoryUnion = AtomFactory | typeof frame.FrameBytes;

export const _syntax: frame.Context = { ...terminals };
export const atomClasses: Array<AtomFactoryUnion> = [
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
  atomClasses.forEach((UnionKlass: AtomFactoryUnion) => {
    if (UnionKlass === frame.FrameBytes) {
      const sample: frame.FrameAtom = new frame.FrameBytes([]);
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
