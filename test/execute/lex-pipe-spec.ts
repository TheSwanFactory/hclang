import { expect } from 'chai'
import { describe, it, beforeEach } from 'mocha'

import { Lex } from '../../src/execute/lex.js'
import { LexBytes } from '../../src/execute/lex-bytes.js'
import { LexPipe } from '../../src/execute/lex-pipe.js'
import * as frame from '../../src/frames.js'
import { ParsePipe } from '../../src/execute/parse-pipe.js'

describe('LexPipe', () => {
  const success = new frame.FrameString('success!')
  let final: frame.FrameArray
  let out: ParsePipe
  let pipe: LexPipe

  beforeEach(() => {
    final = new frame.FrameArray([])
    out = new ParsePipe(final, frame.FrameArray)
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

  it('changes output on push', () => {
    const out = pipe.get(frame.Frame.kOUT)
    const result = pipe.perform({ push: frame.FrameExpr })
    const out2 = pipe.get(frame.Frame.kOUT)
    expect(out2).to.not.equal(out)
    expect(result).to.equal(pipe)
    expect(pipe.level).to.equal(1)
  })

  it('changes output on bind', () => {
    const out = pipe.get(frame.Frame.kOUT)
    const result = pipe.perform({ bind: frame.FrameBind })
    const out2 = pipe.get(frame.Frame.kOUT)
    expect(out2).to.not.equal(out)
    expect(result).to.equal(pipe)
  })
})
