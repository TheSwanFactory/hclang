import { IfElse, IfThen } from "./ops/conditionals.ts";
import { FrameOps } from "./ops/frame-ops.ts";
import {
  MapEnumerable,
  MapProperties,
  ReduceEnumerable,
} from "./ops/iterators.ts";
import {
  Add,
  DataEquals,
  Divide,
  Equals,
  GreaterThan,
  GreaterThanOrEqual,
  LessThan,
  LessThanOrEqual,
  MetadataEquals,
  Modulo,
  Multiply,
  Power,
  Subtract,
} from "./ops/math.ts";
import { BindType, HasType } from "./ops/type-operations.ts";

export { FrameCurry } from "./ops/frame-curry.ts";
export type { ICurryFunction } from "./ops/frame-curry.ts";

export const Ops = new FrameOps({
  "&": ReduceEnumerable,
  "&&": MapProperties,
  ":": IfElse,
  "?": IfThen,
  "|": MapEnumerable,
  "+": Add,
  "-": Subtract,
  "*": Multiply,
  "/": Divide,
  "%%": Modulo,
  "**": Power,
  "=": Equals,
  "==": DataEquals,
  "===": MetadataEquals,
  ">": GreaterThan,
  ">>": GreaterThan,
  ">=": GreaterThanOrEqual,
  "<": LessThan,
  "<<": LessThan,
  "<=": LessThanOrEqual,
  "~": HasType,
  "^": BindType,
});
