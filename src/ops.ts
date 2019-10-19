export { FrameCurry, ICurryFunction } from "./ops/frame-curry";

import { IfElse, IfThen } from "./ops/conditionals";
import { FrameOps } from "./ops/frame-ops";
import { MapEnumerable, MapProperties, ReduceEnumerable } from "./ops/iterators";

export const Ops = new FrameOps({
  "&":  MapEnumerable,
  "&&": MapProperties,
  ":": IfElse,
  "?": IfThen,
  "|":  ReduceEnumerable,
});
