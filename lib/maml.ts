import {
  type Frame,
  FrameArg,
  FrameExpr,
  FrameLazy,
  FrameName,
  FrameString,
  FrameSymbol,
} from "./frames.ts";
import { tag } from "../maml/tag.ts";

const HTML_PREFIX = "<!DOCTYPE html>";

const MakeTag = (name: string, contents: Frame) => {
  return new FrameExpr([
    new FrameSymbol("tag"),
    new FrameString(name),
    contents,
  ]);
};

// The empty name is the bare `.` spelling: the property key the `&&` iterator
// hands the block alongside the value.
const HeadBlock = new FrameLazy([
  new FrameSymbol("tag"),
  new FrameName(""),
  FrameArg.here(),
], { tag });

const head = MakeTag(
  "head",
  new FrameExpr([
    FrameArg.here(),
    new FrameName("&&"),
    HeadBlock,
  ]),
);
const body = MakeTag("body", FrameArg.here());

export const maml = new FrameExpr([
  new FrameString(HTML_PREFIX),
  MakeTag("html", new FrameExpr([head, body])),
], { tag });
