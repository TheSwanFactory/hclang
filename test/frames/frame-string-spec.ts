
import { expect } from 'chai'
import {} from 'mocha'
import { FrameNote, FrameString } from '../../src/frames'

describe('FrameString', () => {
  const js_string = 'Hello, MAML!'
  const key = 'key'
  const value = new FrameString('value')
  const frame_string = new FrameString(js_string, { key: value })

  it('is created from a JavaScript string', () => {
    expect(frame_string).to.be.instanceOf(FrameString)
  })

  it('takes a context', () => {
    expect(frame_string.get(key)).to.equal(value)
  })

  it('uses smart quotes as prefix and suffix', () => {
    expect(frame_string.string_prefix()).to.equal('“')
    expect(frame_string.string_suffix()).to.equal('”')
    expect(frame_string.toStringData()).to.equal(`“${js_string}”`)
  })

  it('stringifies with smart quotes', () => {
    expect(value.toString()).to.equal('“value”')
    expect(frame_string.toString()).to.equal(`(“${js_string}”, .key “value”;)`)
  })

  it('concatenates when called with a FrameString', () => {
    const js_string_2 = ' Goodbye, world!'
    const frame_string_2 = new FrameString(js_string_2)
    const result = frame_string.call(frame_string_2)
    expect(result.toString()).to.include(`“${js_string}${js_string_2}”`)
  })

  it('stringifies when called with something else', () => {
    const note = FrameNote.key(key, value)
    const result = frame_string.call(note)
    expect(result.toString()).to.include(key)
  })

  it('returns Note parent on failed reduce', () => {
    const note = FrameNote.key(key, value)
    const result = frame_string.reduce(note)
    expect(result).to.equal(value)

    const extras = note.get(FrameNote.NOTE_EXTRAS)
    expect(extras.toString()).to.include('H, e, l, l, o')
  })
})
