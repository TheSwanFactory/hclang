#!/usr/bin/env node
import fs from 'fs'
import readline from 'readline'
import { HCEval } from '../execute/hc-eval.js'

const RUNDOC = '#!/usr/bin/env hc \n```\n'

function runfile (hc_eval: HCEval, file: any) {
  const rl = readline.createInterface(fs.createReadStream(file), undefined)
  rl.on('line', (line) => {
    hc_eval.call(line)
  })
  return true
}

export { runfile }
