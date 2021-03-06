import * as _ from 'lodash'
import * as frame from '../frames'
import { FrameSpace } from './frame-space'
import { Lex } from './lex'
import { terminals } from './terminals'

export const syntax: frame.Context = _.clone(terminals)

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

_.map(atomClasses, (Klass: any) => {
  const sample: frame.FrameAtom = new Klass('')
  const key = sample.string_start()
  syntax[key] = new Lex(Klass)
})
