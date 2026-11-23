import {
  Frame,
  FrameArg,
  FrameArray,
  FrameExpr,
  FrameLazy,
  FrameString,
} from "../frames.ts";

const wrapArg = (prefix: string, suffix: string): FrameExpr => {
  return new FrameExpr([
    new FrameString(prefix),
    FrameArg.here(),
    new FrameString(suffix),
  ]);
};

/**
 * Wraps contents in an element named by its first argument.
 *
 * `tag.call(name).call(contents)` renders `<name>contents</name>`.
 */
export const tag: Frame = new FrameExpr([
  new FrameLazy([]),
  new FrameArray([
    wrapArg("<", ">"),
    FrameArg.level(2),
    wrapArg("</", ">"),
  ]),
]);
