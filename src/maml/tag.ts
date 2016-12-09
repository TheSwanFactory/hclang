import { Frame, FrameExpr, FrameLazy, FrameString, FrameSymbol } from "../frames";

export const tag = (name: string, body: Frame) => {
  return new FrameExpr([
    tag_lazy(name),
    body,
  ]);
};

const wrap_args = (prefix: string, suffix: string) => {
  return new FrameExpr([
    new FrameString(prefix),
    FrameSymbol.here(),
    new FrameString(suffix),
  ]);
}

const tag_lazy = (name: string) => {
  const expr: Frame = new FrameExpr([
    new FrameString(`<${name}>`),
    FrameSymbol.here(),
    new FrameString(`</${name}>`),
  ]);
  return new FrameLazy(expr);
};
