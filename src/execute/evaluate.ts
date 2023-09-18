import { Frame, FrameArray } from '../frames.js'
import { HCEval } from './hc-eval.js'

export const evaluate = (input: string): Frame => {
  const out = new FrameArray([])
  const hc_eval = new HCEval(out)
  hc_eval.call(input)
  return out
}
