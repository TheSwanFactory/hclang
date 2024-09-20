import { IfElse, IfThen } from './ops/conditionals.js'
import { FrameOps } from './ops/frame-ops.js'
import { MapEnumerable, MapProperties, ReduceEnumerable } from './ops/iterators.js'
import { Add, Divide, Equals, GreaterThan, GreaterThanOrEqual, LessThan, LessThanOrEqual, Modulo, Multiply, Power, Subtract } from './ops/math.js'

export { FrameCurry, ICurryFunction } from './ops/frame-curry.js'

export const Ops = new FrameOps({
  '&': MapEnumerable,
  '&&': MapProperties,
  ':': IfElse,
  '?': IfThen,
  '|': ReduceEnumerable,
  '+': Add,
  '-': Subtract,
  '*': Multiply,
  '/': Divide,
  '%%': Modulo,
  '**': Power,
  '=': Equals,
  '>>': GreaterThan,
  '>=': GreaterThanOrEqual,
  '<<': LessThan,
  '<=': LessThanOrEqual
})
