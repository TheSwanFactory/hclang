#!/usr/bin/env node
import { HCEval } from '../execute/hc-eval.ts'
import { HCLog } from '../execute/hc-log.ts'
import { HCTest } from '../execute/hc-test.ts'
import minimist from 'minimist'
import { runfile } from './runfile.ts'

const aliases = {
  e: 'evaluate',
  h: 'help',
  i: 'interactive',
  t: 'testdoc',
  v: 'verbose',
  V: 'version'
}
const options = minimist(Deno.args.slice(2), { alias: aliases })
if (options.verbose) {
  console.error('options', options)
}

async function main() {
  const context = HCEval.make_context(Deno.env)
  const out = new HCLog(context)
  let hc_eval = new HCEval(out)
  let evaluated = false
  let test: HCTest

  if (options.testdoc) {
    test = new HCTest(out)
    hc_eval = new HCEval(test)
    evaluated = true
  }

  if (options.evaluate) {
    hc_eval.call(options.evaluate.toString())
    evaluated = true
  }

  for (const file of options._) {
    evaluated = await runfile(hc_eval, file)
  }

  if (options.interactive || !evaluated) {
    out.prompt = true
    hc_eval.repl()
  }
}

main().catch(err => {
  console.error(err)
  Deno.exit(1)
})
