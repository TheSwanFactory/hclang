import { FrameArg, FrameExpr, FrameString, FrameSymbol } from "./frames";
import { tag } from "./maml/tag";

const HTML_PREFIX = "<!DOCTYPE html>";

const body = (level = 1) => {
  return new FrameExpr([
    new FrameString(HTML_PREFIX),
    new FrameExpr([
      new FrameSymbol("tag"),
      new FrameString("html"),
      new FrameExpr([
        new FrameSymbol("tag"),
        new FrameString("body"),
        FrameArg.here(),
      ]),
    ]),
  ], {tag});
};

export const maml = body();
