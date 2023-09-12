import { expect } from 'chai'
import {} from 'mocha'
import { execute } from '../../src/execute/execute'
// const execute2 = require('../../src/execute/execute') //.execute
// const execute3 = require('../../src/execute') //.execute

describe('execute', () => {
  const input_string = '“Watson I need you”'
  const other_string = '“Holmes I need you”'
  const both_strings = `${input_string}\n${other_string}`
  const inline_comment = '#Inline comment#'
  const endline_comment = '#End-of-line\n'
  const spaces = '  '

  describe('terminators', () => {
    it('evaluates spaces to nothing', () => {
      const result = execute(spaces)
      expect(result).to.equal('')
    })
  })
})
