import { IfElse, IfThen } from "./ops/conditionals.ts";
import { ZipElements } from "./ops/pairings.ts";
import { multiplyDenum } from "./frames/fourth-hash.ts";
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
import { Arrow, BindReturn, BindType } from "./ops/type-operations.ts";

import "./ops/frame-curry.ts";
export type { ICurryFunction } from "./ops/frame-curry.ts";

export const Ops = new FrameOps({
  "&": MapElements,
  "&&": MapMembers,
  "&|": SpliceElements,
  "&|&": multiplyDenum,
  "|&|": ZipElements,
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
  "^^": BindReturn,
  "->": Arrow,
});
