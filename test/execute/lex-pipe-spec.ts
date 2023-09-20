import { expect } from 'chai'
import {} from 'mocha'
import { Lex } from '../../src/execute/lex.js'
import { LexBytes } from '../../src/execute/lex-bytes.js'
import { LexPipe } from '../../src/execute/lex-pipe.js'
import * as frame from '../../src/frames.js'

describe('LexPipe', () => {
  const success = new frame.FrameString('success!')
  let out: frame.FrameArray
  let pipe: LexPipe

  beforeEach(() => {
    out = new frame.FrameArray([])
    out.set(frame.Frame.kEND, success)
    pipe = new LexPipe(out)
  })

  it('is exported', () => {
    expect(LexPipe).to.be.ok
  })

  it('is constructed from an out parameter', () => {
    expect(pipe).to.be.ok
  })

  it('returns itself on finish', () => {
    const result = pipe.finish(frame.Frame.nil)
    expect(result).to.equal(pipe)
  })
})
