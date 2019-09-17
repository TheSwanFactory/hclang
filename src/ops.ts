import { Frame, FrameArg, FrameExpr } from "./frames";
export { ICurryFunction } from "./ops/frame-curry";
import { FrameOps } from "./ops/frame-ops";
import { MapProperties, MapEnumerable } from "./ops/iterators";

export const Ops = new FrameOps({
  "&":  MapEnumerable,
  "&&": MapProperties,
});
