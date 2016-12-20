import { FrameArg, FrameExpr, FrameString, FrameSymbol } from "./frames";
import { tag } from "./maml/tag";

const body = new FrameString("body");

export const maml = new FrameExpr([
  new FrameSymbol("tag"),
  body,
  FrameArg.here(),
], {tag});
