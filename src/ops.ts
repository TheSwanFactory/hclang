export { ICurryFunction } from "./ops/frame-curry";
import { FrameOps } from "./ops/frame-ops";
import { MapEnumerable, MapProperties, ReduceEnumerable } from "./ops/iterators";

export const Ops = new FrameOps({
  "&":  MapEnumerable,
  "&&": MapProperties,
  "|":  ReduceEnumerable,
});
