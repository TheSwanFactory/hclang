import { expect } from 'chai'
import { describe, it } from 'mocha'

import { FrameDoc } from '../../src/frames.js'

describe('FrameDoc', () => {
  const source = '\ndoctest\n'
  const frame_doc = new FrameDoc(source)

  it('is exported', () => {
    expect(FrameDoc).to.be.ok
  })

  it('is created from a string', () => {
    expect(frame_doc).to.be.instanceOf(FrameDoc)
  })

  it('stringifies with "`"', () => {
    expect(frame_doc.toString()).to.equal(`\`${source}\``)
  })
})
