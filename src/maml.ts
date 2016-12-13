import { FrameArg, FrameExpr, FrameName, FrameString } from "./frames";
import { tag } from "./maml/tag";

const body = new FrameString("body");

export const maml = new FrameExpr([
  new FrameExpr([
    new FrameName("tag"),
    body,
    FrameArg.here(),
  ]),
], {tag});
