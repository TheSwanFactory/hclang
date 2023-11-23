import { expect } from 'chai'
import { describe, it, beforeEach } from 'mocha'

import { Token } from '../../src/execute/lex.js'
import { ParsePipe } from '../../src/execute/parse-pipe.js'
import * as frame from '../../src/frames.js'
import * as ops from '../../src/ops.js'

describe('Parse', () => {
  const content = new frame.FrameString('content')
  const token = new Token(content)

  let out: frame.FrameArray
  let pipe: ParsePipe
  beforeEach(() => {
    out = new frame.FrameArray([])
    pipe = new ParsePipe(out, frame.FrameGroup)
  })

  describe('Token', () => {
    it('is exported', () => {
      expect(Token).to.be.ok
    })

    it('is constructed from a Frame', () => {
      expect(token).to.be.ok
    })

    it('calls callee with content when called', () => {
      const result = out.call(token)
      expect(out.asArray().length).to.equal(1)
      expect(out.at(0)).to.equal(content)
    })
  })

  describe('ParsePipe', () => {
    it('is exported', () => {
      expect(ParsePipe).to.be.ok
    })

    it('is constructed from an out parameter', () => {
      expect(pipe).to.be.ok
    })

    it('emits empty Group on end', () => {
      pipe.call(frame.FrameSymbol.end())
      expect(out.size()).to.equal(1)
      const result = out.at(0)
      expect(result).to.be.instanceOf(frame.FrameGroup)
    })

    it('adds token contents on `call`', () => {
      expect(pipe.length()).to.equal(0)
      pipe.call(token)
      expect(pipe.length()).to.equal(1)
      pipe.call(token)
      expect(pipe.length()).to.equal(2)
    })

    it('collects contents on `next`', () => {
      pipe.call(token)
      expect(pipe.length()).to.equal(1)
      pipe.next(false)
      expect(pipe.length()).to.equal(0)
      const collector = pipe.collector
      expect(collector.length).to.equal(1)
    })

    it('emits Grouped group on `finish`', () => {
      pipe.call(token)
      pipe.call(frame.FrameSymbol.end())
      expect(out.size()).to.equal(1)
      const group = out.at(0)
      expect(group).to.be.instanceOf(frame.FrameGroup)
      expect(group.toString()).to.equal(`((${content}))`)
    })

    it('joins strings in Grouped', () => {
      pipe.call(token)
      pipe.call(token)
      pipe.call(frame.FrameSymbol.end())
      expect(out.size()).to.equal(1)
      const group = out.at(0)
      expect(group).to.be.instanceOf(frame.FrameGroup)
      expect(group.toString()).to.equal(`((${content} ${content}))`)
    })

    it('commas Grouped strings on `next(false)`', () => {
      pipe.call(token)
      pipe.next(false)
      pipe.call(token)
      pipe.call(frame.FrameSymbol.end())
      expect(out.size()).to.equal(1)
      const group = out.at(0)
      expect(group).to.be.instanceOf(frame.FrameGroup)
      expect(group.toString()).to.equal(`((${content}), (${content}))`)
    })

    it('semicolons Grouped strings on `next(true)`', () => {
      pipe.call(token)
      pipe.next(true)
      pipe.call(token)
      pipe.call(frame.FrameSymbol.end())
      expect(out.size()).to.equal(1)
      const group = out.at(0)
      expect(group).to.be.instanceOf(frame.FrameGroup)
      expect(group.toString()).to.equal(`((${content}); (${content}))`)
    })
  })
})
