import * as frame from "../frames.ts";
import { type AtomFactory, Lex } from "./lex.ts";
import { terminals } from "./terminals.ts";

export const _syntax: frame.Context = { ...terminals };
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

let has_syntax = false;
export function getSyntax() {
  if (has_syntax === true) {
    return _syntax;
  }
  has_syntax = true;
  atomClasses.forEach((Klass: AtomFactory) => {
    const sample: frame.FrameAtom = new Klass("");
    const key = sample.string_start();
    const lexee = new Lex(Klass);
    _syntax[key] = lexee;
    return true;
  });

  return _syntax;
}
