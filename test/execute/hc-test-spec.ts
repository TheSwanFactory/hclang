import { expect } from 'chai'
import { describe, it, beforeEach } from 'mocha'

import { HCEval } from '../../src/execute/hc-eval.js'
import { HCTest } from '../../src/execute/hc-test.js'
import * as frame from '../../src/frames.js'

describe('HCTest', () => {
  let out: frame.FrameArray
  let test: HCTest
  let hc_eval: HCEval
  beforeEach(() => {
    out = new frame.FrameArray([])
    test = new HCTest(out)
    hc_eval = new HCEval(test)
  })

  it('sets source on out when called with input string', () => {
    hc_eval.call('; .abc')
    const result = test.get(HCEval.SOURCE)
    expect(result.toString()).to.include('“.abc”')
  })

  it('assertEqual returns FrameNote.pass if expected == actual', () => {
    const result = test.assertEqual('123', '123', 'abc')
    expect(result.toString()).to.include('$+.test-pass “abc +123”;')
  })

  it('assertEqual returns FrameNote.fail if expected != actual', () => {
    const result = test.assertEqual('123', '456', 'abc')
    expect(result.toString()).to.include('$-.test-fail “abc +123 -456”;')
  })

  it('outputs Note+ when called with correct testDoc', () => {
    hc_eval.call('.abc 123;')
    expect(out.length()).to.equal(0)

    hc_eval.call('; abc')
    expect(out.length()).to.equal(0)

    hc_eval.call('# 123')
    expect(out.length()).to.equal(1)

    const result = out.at(0)
    expect(result.toString()).to.include('$+.test-pass ““abc” +“123””;')
  })

  it('outputs Note- when called with incorrect testDoc', () => {
    hc_eval.call('.abc 456;')
    hc_eval.call('; abc')
    hc_eval.call('# 123')
    expect(out.length()).to.equal(1)
    const result = out.at(0)
    expect(result.toString()).to.include('$-.test-fail ““abc” +“123” -“456””;')
  })
})
