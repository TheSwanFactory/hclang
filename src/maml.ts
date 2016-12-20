import { FrameArg, FrameExpr, FrameString, FrameSymbol } from "./frames";
import { tag } from "./maml/tag";

const body = (level = 1) => {
  return new FrameExpr([
    new FrameSymbol("tag"),
    new FrameString("body"),
    FrameArg.here(),
  ], {tag});
};

export const maml = body();
