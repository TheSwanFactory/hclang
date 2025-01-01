import { IfElse, IfThen } from './ops/conditionals.ts'
import { FrameOps } from './ops/frame-ops.ts'
import { MapEnumerable, MapProperties, ReduceEnumerable } from './ops/iterators.ts'
import { Add, Divide, Equals, GreaterThan, GreaterThanOrEqual, LessThan, LessThanOrEqual, Modulo, Multiply, Power, Subtract } from './ops/math.ts'

export { FrameCurry, ICurryFunction } from './ops/frame-curry.ts'

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
  '>': GreaterThan,
  '>=': GreaterThanOrEqual,
  '<': LessThan,
  '<=': LessThanOrEqual
})
