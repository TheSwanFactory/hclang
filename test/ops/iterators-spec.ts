import { expect } from 'chai'
import {} from 'mocha'
import * as frame from '../../src/frames.js'

describe('iterators', () => {
  const base = new frame.Frame({
    author: new frame.FrameString('An Author'),
    title: new frame.FrameString('A Title')
  })

  const block = new frame.FrameString('Prefix: ')

  it('treat frame.Frames as iteratee blocks', () => {
    const arg = new frame.FrameString('argument')
    const result = block.call(arg)
    expect(result.toString()).to.equal('“Prefix: argument”')
  })

  describe('&& iterate over metas', () => {
    const operator = base.get('&&')
    const result = operator.call(block)

    it('lives in the global namespace', () => {
      expect(operator).to.be.ok
      expect(operator).to.not.equal(frame.Frame.missing)
      expect(operator.is.missing).to.not.equal(true)
    })

    it('returns frame.FrameArray when called', () => {
      expect(result).to.be.instanceOf(frame.FrameArray)
    })

    it('calls block with each element', () => {
      const result_string = result.toString()
      expect(result_string).to.include('Prefix: An Author')
      expect(result_string).to.include('Prefix: A Title')
    })

    it('calls block with key as second parameter', () => {
      const expr = new frame.FrameExpr([
        frame.FrameParam.there(),
        new frame.FrameString(': '),
        frame.FrameArg.here()
      ])
      const expr_result = operator.call(expr)
      const expr_string = expr_result.toString()
      expect(expr_string).to.include('author: An Author')
      expect(expr_string).to.include('title: A Title')
    })

    it('is curried using a name', () => {
      const curry = new frame.FrameExpr([
        frame.FrameArg.here(),
        new frame.FrameName('&&')
      ])
      const curry_result = curry.call(base)
      const curry_string = curry_result.toString()
      expect(curry_string).to.include('FrameCurry')
    })

    it('is called as a name with a lazy block', () => {
      const TestBlock = new frame.FrameLazy([
        new frame.FrameString(' [ key: '),
        frame.FrameParam.there(),
        new frame.FrameString('| value: '),
        frame.FrameArg.here(),
        new frame.FrameString(' ] ')
      ])
      const expr = new frame.FrameExpr([
        frame.FrameArg.here(),
        new frame.FrameName('&&'),
        TestBlock
      ])
      const expr_result = expr.call(base)
      const expr_string = expr_result.toString()
      expect(expr_string).to.include('[ key: author| value: An Author ]')
    })
  })
})
