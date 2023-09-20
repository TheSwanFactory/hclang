#!/usr/bin/env node
import fs from 'fs'
import readline from 'readline'
import { HCEval } from '../execute/hc-eval.js'
import { HCLog } from '../execute/hc-log.js'
import { HCTest } from '../execute/hc-test.js'
import minimist from 'minimist'

const options = minimist(process.argv.slice(2))
const opts = {
  evaluate: 'e',
  help: 'h',
  interactive: 'i',
  testdoc: 't',
  verbose: 'v',
  _: []
}
if (options.v) {
  console.error('options', options)
}

const context = HCEval.make_context(process.env)
const out = new HCLog(context)
let hc_eval = new HCEval(out)
let evaluated = false
let test: HCTest

if (options.t) {
  test = new HCTest(out)
  hc_eval = new HCEval(test)
}

if (options.e) {
  hc_eval.call(options.e.toString())
  evaluated = true
}

options._.forEach((file: any) => {
  const rl = readline.createInterface(fs.createReadStream(file), undefined)
  rl.on('line', (line) => {
    hc_eval.call(line)
  })
  evaluated = true
})

if (options.i || !options.e) {
  out.prompt = true
  hc_eval.repl()
}
