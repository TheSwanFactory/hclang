
import { expect } from 'chai'
import { } from 'mocha'
import { evaluate } from '../../src/execute/evaluate'
import * as frame from '../../src/frames'

describe('evaluate', () => {
  it('is exported', () => {
    expect(evaluate).to.be.ok
  })

  it('returns empty array for empty string', () => {
    const result = evaluate.call('')
    expect(result).to.be.instanceof(frame.FrameArray)
    expect(result.toString()).to.equal('[]')
  })

  it('ignores comments', () => {
    const input = '#Goodbye'
    const result = evaluate(input)
    expect(result.toString()).to.equal('[]')
  })

  it('ignores spaces', () => {
    const input = '  '
    const result = evaluate(input)
    expect(result.toString()).to.equal('[]')
  })

  describe('strings', () => {
    it('quines string literal', () => {
      const input = '“Hello, HC!”'
      const result = evaluate(input)
      expect(result.toString()).to.equal(`[${input}]`)
    })

    it('quines string before spaces', () => {
      const input = '“Hello, HC!”'
      const suffix = `${input}  `
      const result = evaluate(suffix)
      expect(result.toString()).to.equal(`[${input}]`)
    })

    it('quines string after spaces', () => {
      const input = '“Hello, HC!”'
      const prefix = `  ${input}`
      const result = evaluate(prefix)
      expect(result.toString()).to.equal(`[${input}]`)
    })

    it('joins multiple strings', () => {
      const input = '“Hello”“, HC!”'
      const result = evaluate(input)
      expect(result.toString()).to.equal('[“Hello, HC!”]')
    })

    it('joins around inner space', () => {
      const input = '“Hello” “, HC!”'
      const result = evaluate(input)
      expect(result.toString()).to.equal('[“Hello, HC!”]')
    })

    it('joins multi-line doc-strings into strings', () => {
      const input = '```\nDoc String\n```'
      const result = evaluate(input)
      expect(result.toString()).to.equal('[“\nDoc String\n”]')
    })
  })

  describe('grouping', () => {
    it('returns FrameArray for empty []', () => {
      const result = evaluate('[]')
      const output = result.at(0)
      expect(output).to.be.instanceof(frame.FrameArray)
    })

    it('returns closure for empty {}', () => {
      const result = evaluate('{}')
      const output = result.at(0)
      expect(output).to.be.instanceof(frame.FrameLazy)
    })
  })
})
