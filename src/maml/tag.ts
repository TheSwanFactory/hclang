import { Frame, FrameArg, FrameArray, FrameExpr, FrameLazy, FrameString } from "../frames";

const wrapArgs = (prefix: string, suffix: string) => {
  return new FrameExpr([
    new FrameString(prefix),
    FrameArg.here(),
    new FrameString(suffix),
  ]);
};

export const tag = new FrameExpr([
  new FrameLazy([]),
  new FrameArray([
    wrapArgs("<", ">"),
    FrameArg.level(2),
    wrapArgs("</", ">"),
  ]),
]);
