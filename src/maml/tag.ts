import { Frame, FrameArg, FrameExpr, FrameLazy, FrameString } from "../frames";

export const tag = new FrameExpr([]);

const wrapArgs = (prefix: string, suffix: string) => {
  return new FrameExpr([
    new FrameString(prefix),
    FrameArg.here(),
    new FrameString(suffix),
  ]);
};

export const tagLazy = (name: string) => {
  const expr: Frame = new FrameExpr([
    new FrameString(`<${name}>`),
    FrameArg.here(),
    new FrameString(`</${name}>`),
  ]);
  return new FrameLazy(expr);
};
