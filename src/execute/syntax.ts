import * as frame from '../frames.js'
import { Lex } from './lex.js'
import { terminals } from './terminals.js'

export const _syntax: frame.Context = { ...terminals }
type Class = { new(...args: any[]): any; };
export const atomClasses: Array<Class> = [
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
  frame.FrameSymbol
]

let has_syntax = false
export function getSyntax () {
  if (has_syntax === true) {
    return _syntax
  }
  has_syntax = true
  atomClasses.forEach((Klass: any) => {
    const sample: frame.FrameAtom = new Klass('')
    const key = sample.string_start()
    const lexee = new Lex(Klass)
    _syntax[key] = lexee
    return true
  })
  return _syntax
}
