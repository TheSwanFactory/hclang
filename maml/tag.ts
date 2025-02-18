import {
  FrameArg,
  FrameArray,
  FrameExpr,
  FrameLazy,
  FrameString,
} from "../lib/frames.ts";

const wrapArg = (prefix: string, suffix: string): FrameExpr => {
  return new FrameExpr([
    new FrameString(prefix),
    FrameArg.here(),
    new FrameString(suffix),
  ]);
};

export const tag: FrameExpr = new FrameExpr([
  new FrameLazy([]),
  new FrameArray([
    wrapArg("<", ">"),
    FrameArg.level(2),
    wrapArg("</", ">"),
  ]),
]);
