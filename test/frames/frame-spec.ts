import { expect } from 'chai'
import {} from 'mocha'
import { Context, Frame, FrameArray, FrameString, FrameSymbol, IKeyValuePair, NilContext } from '../../src/frames'

describe('Frame', () => {
  const frame = new Frame({ nil: Frame.nil })

  it('is constructed from a dictionary', () => {
    expect(frame).to.be.instanceOf(Frame)
  })

  it('has a unique nil for a property', () => {
    const nil = Frame.nil
    expect(nil).to.be.instanceOf(Frame)
    expect(Frame.nil).to.equal(nil)
  })

  it('returns argument when called with non-nil', () => {
    const frame2 = new Frame(NilContext, false)
    const result = frame.call(frame2)
    expect(result).to.equal(frame2)
  })

  it('returns self when called with nil', () => {
    const result = frame.call(Frame.nil)
    expect(result).to.equal(frame)
  })

  it('stringifies to context', () => {
    expect(Frame.nil.toString()).to.equal('()')
    expect(frame.toString()).to.equal('(.nil ();)')
  })

  it('is in-dependent of context (literal)', () => {
    expect(frame.in()).to.equal(frame)
  })
})
