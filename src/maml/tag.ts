import { Frame, FrameArg, FrameExpr, FrameLazy, FrameString } from "../frames";

const wrap_args = (prefix: string, suffix: string) => {
  return new FrameExpr([
    new FrameString(prefix),
    FrameArg.here(),
    new FrameString(suffix),
  ]);
}

export const tag_lazy = (name: string) => {
  const expr: Frame = new FrameExpr([
    new FrameString(`<${name}>`),
    FrameArg.here(),
    new FrameString(`</${name}>`),
  ]);
  return new FrameLazy(expr);
};
