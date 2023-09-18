#!/usr/bin/env node
import fs from 'fs.js'
import getopts from 'getopts.js'
import _ from 'lodash.js'
import readline from 'readline.js'
import { HCEval } from '../execute/hc-eval.js'
import { HCLog } from '../execute/hc-log.js'
import { HCTest } from '../execute/hc-test.js'

const options = getopts(process.argv.slice(2), {
  alias: {
    evaluate: 'e',
    help: 'h',
    interactive: 'i',
    testdoc: 't',
    verbose: 'v'
  }
})
if (options.verbose) {
  console.error('options', options)
}

const context = HCEval.make_context(process.env)
const out = new HCLog(context)
let hc_eval = new HCEval(out)
let evaluated = false
let test: HCTest

if (options.testdoc) {
  test = new HCTest(out)
  hc_eval = new HCEval(test)
}

if (options.evaluate) {
  hc_eval.call(options.evaluate.toString())
  evaluated = true
}

_.each(options._, (file) => {
  const rl = readline.createInterface(fs.createReadStream(file), null)
  rl.on('line', (line) => {
    hc_eval.call(line)
  })
  evaluated = true
})

if (options.interactive || !evaluated) {
  out.prompt = true
  hc_eval.repl()
}
