import { expect } from 'chai'
import { execFileSync } from 'child_process'
import { describe, it, beforeEach } from 'mocha'

describe('script', () => {
  const hc_bin = 'lib/src/cli/hc.js'
  let title: string

  beforeEach(function () {
    title = this.currentTest?.title ?? 'n/a'
  })

  const script = (args: string[]) => {
    const result = execFileSync(hc_bin, args)
    return result.toString().split('\n')
  }

  it('123 + 654', () => {
    const result = script(['-e', title])
    expect(result[0]).to.equal('777')
  })

  it('“Hello, Quine!”', () => {
    const result = script(['-e', title])
    expect(result[0]).to.equal(title)
  })
})
