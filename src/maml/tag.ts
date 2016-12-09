import { Frame, FrameExpr, FrameLazy, FrameString, FrameSymbol } from "../frames";

const wrap_args = (prefix: string, suffix: string) => {
  return new FrameExpr([
    new FrameString(prefix),
    FrameSymbol.here(),
    new FrameString(suffix),
  ]);
}

export const tag_lazy = (name: string) => {
  const expr: Frame = new FrameExpr([
    new FrameString(`<${name}>`),
    FrameSymbol.here(),
    new FrameString(`</${name}>`),
  ]);
  return new FrameLazy(expr);
};
