import { expect } from 'chai.js'
import {} from 'mocha.js'
import { FrameNumber } from '../../src/frames.js'

describe('FrameNumber', () => {
  const source = '12345667890'
  const frame_number = new FrameNumber(source)

  it('is exported', () => {
    expect(FrameNumber).to.be.ok
  })

  it('is created from a string', () => {
    expect(frame_number).to.be.instanceOf(FrameNumber)
  })

  it('stringifies back to that string', () => {
    expect(frame_number.toString()).to.equal(source)
  })
})
