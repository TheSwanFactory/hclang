#!/usr/bin/env node
import fs from 'fs'
import readline from 'readline'
import { HCEval } from '../execute/hc-eval.ts'

const RUNDOC = '#!/usr/bin/env hc \n```\n'
const ENDDOC = '```\n'

function is_doc (file: string) {
  const file_ext = file.split('.').pop()
  return file_ext === 'adoc' || file_ext === 'md'
}

function runfile (hc_eval: HCEval, file: any) {
  const file_ext = file.split('.').pop()
  const is_doc_file = is_doc(file)
  if (is_doc_file) {
    hc_eval.call(RUNDOC)
  }
  const rl = readline.createInterface(fs.createReadStream(file), undefined)
  rl.on('line', (line) => {
    hc_eval.call(line)
  })
  rl.on('close', () => {
    if (is_doc_file) {
      hc_eval.call(ENDDOC)
    }
  })
  return true
}

export { runfile }
