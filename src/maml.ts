import { Frame, FrameArg, FrameExpr, FrameString, FrameSymbol } from "./frames";
import { tag } from "./maml/tag";

const HTML_PREFIX = "<!DOCTYPE html>";

const make_tag = (name: string, contents: Frame) => {
  return  new FrameExpr([
      new FrameSymbol("tag"),
      new FrameString(name),
      contents,
    ]);
};

const title = make_tag("title", FrameExpr.extract("title"));
const head = make_tag("head", title);
const body = make_tag("body", FrameArg.here());

export const maml = new FrameExpr([
  new FrameString(HTML_PREFIX),
  make_tag("html", new FrameExpr([head, body])),
], {tag});
