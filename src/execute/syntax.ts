import * as frame from '../frames.js'
import { FrameSpace } from './frame-space.js'
import { Lex } from './lex.js'
import { terminals } from './terminals.js'

export const _syntax: frame.Context = { ...terminals }

const atomClasses: Array<any> = [
  FrameSpace,
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

export function getSyntax () {
  if (Object.keys(_syntax).length === 0) {
    atomClasses.forEach((Klass: any) => {
      const sample: frame.FrameAtom = new Klass('')
      const key = sample.string_start()
      _syntax[key] = new Lex(Klass)
    })
  }
  return _syntax
}
