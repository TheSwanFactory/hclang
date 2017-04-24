import { Frame, FrameArg, FrameExpr } from "./frames";
export { ICurryFunction } from "./ops/frame-curry";
import { FrameOps } from "./ops/frame-ops";
import { MetaMap } from "./ops/iterators";

export const Ops = new FrameOps({
  "&&": MetaMap,
});
