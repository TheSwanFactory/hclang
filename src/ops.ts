import { IfElse, IfThen } from './ops/conditionals.js'
import { FrameOps } from './ops/frame-ops.js'
import { MapEnumerable, MapProperties, ReduceEnumerable } from './ops/iterators.js'

export { FrameCurry, ICurryFunction } from './ops/frame-curry.js'

export const Ops = new FrameOps({
  '&': MapEnumerable,
  '&&': MapProperties,
  ':': IfElse,
  '?': IfThen,
  '|': ReduceEnumerable
})
