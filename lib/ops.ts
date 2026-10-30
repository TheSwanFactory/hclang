import { IfElse, IfThen } from "./ops/conditionals.ts";
import { FrameOps } from "./ops/frame-ops.ts";
import {
  MapElements,
  MapMembers,
  ReduceElements,
  ReduceMembers,
  SpliceElements,
} from "./ops/iterators.ts";
import {
  Add,
  Divide,
  Equals,
  GreaterThan,
  GreaterThanOrEqual,
  Identical,
  LessThan,
  LessThanOrEqual,
  Modulo,
  Multiply,
  Power,
  Subtract,
  TypeEquals,
} from "./ops/math.ts";
import { IdenticalMember, Member, TypedMember } from "./ops/membership.ts";
import { BindType } from "./ops/type-operations.ts";

export { FrameCurry } from "./ops/frame-curry.ts";
export type { ICurryFunction } from "./ops/frame-curry.ts";

export const Ops = new FrameOps({
  "&": MapElements,
  "&&": MapMembers,
  "&|": SpliceElements,
  ":": IfElse,
  "?": IfThen,
  "|": ReduceElements,
  "||": ReduceMembers,
  "+": Add,
  "-": Subtract,
  "*": Multiply,
  "/": Divide,
  "%%": Modulo,
  "**": Power,
  "=": Equals,
  "==": TypeEquals,
  "===": Identical,
  ">": GreaterThan,
  ">>": GreaterThan,
  ">=": GreaterThanOrEqual,
  "<": LessThan,
  "<<": LessThan,
  "<=": LessThanOrEqual,
  "~": Member,
  "~~": TypedMember,
  "~~~": IdenticalMember,
  "^": BindType,
});
