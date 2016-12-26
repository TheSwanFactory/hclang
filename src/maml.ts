import { Frame, FrameArg, FrameExpr, FrameString, FrameSymbol } from "./frames";
import { tag } from "./maml/tag";

const HTML_PREFIX = "<!DOCTYPE html>";

const MakeTag = (name: string, contents: Frame) => {
  return  new FrameExpr([
      new FrameSymbol("tag"),
      new FrameString(name),
      contents,
    ]);
};

const title = MakeTag("title", FrameExpr.extract("title"));
const head = MakeTag("head", title);
const body = MakeTag("body", FrameArg.here());

export const maml = new FrameExpr([
  new FrameString(HTML_PREFIX),
  MakeTag("html", new FrameExpr([head, body])),
], {tag});
