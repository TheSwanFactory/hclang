
import { expect } from 'chai'
import {} from 'mocha'
import { FrameComment } from '../../src/frames'

describe('FrameComment', () => {
  const source = 'Frankly, my dear'
  const frame_comment = new FrameComment(source)

  it('is exported', () => {
    expect(FrameComment).to.be.ok
  })

  it('is created from a string', () => {
    expect(frame_comment).to.be.instanceOf(FrameComment)
  })

  it('stringifies with `#`', () => {
    expect(frame_comment.toString()).to.equal(`#${source}#`)
  })
})
