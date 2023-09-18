import { Frame, FrameArray } from '../frames.js'
import { HCEval } from './hc-eval.js'

export const evaluate = (input: string, ...args: any): Frame => {
  const out = new FrameArray([])
  const hc_eval = new HCEval(out)
  hc_eval.call(input)
  return out
}
// https://stackoverflow.com/questions/63524054/typescript-optional-arguments-spreading-crashing-in-v4
