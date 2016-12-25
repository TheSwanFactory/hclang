import { FrameArg, FrameExpr, FrameString, FrameSymbol } from "./frames";
import { tag } from "./maml/tag";

const HTML_PREFIX = "<!DOCTYPE html>";

const head = [
  new FrameSymbol("tag"),
  new FrameString("head"),
  FrameExpr.extract("title"),
];

const body = [
  new FrameSymbol("tag"),
  new FrameString("body"),
  FrameArg.here(),
];

export const maml = new FrameExpr([
  new FrameString(HTML_PREFIX),
  new FrameExpr([
    new FrameSymbol("tag"),
    new FrameString("html"),
    new FrameExpr([
      new FrameExpr(head),
      new FrameExpr(body),
    ]),
  ]),
], {tag});
