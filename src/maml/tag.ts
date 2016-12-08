import { Frame, FrameExpr, FrameLazy, FrameString, FrameSymbol } from "../frames";

export const tag = (name: string, body: Frame) => {
  return new FrameExpr([
    new FrameString(`<${name}>`),
    body,
    new FrameString(`</${name}>`),
  ]);
};

const wrap_args = (prefix: string, suffix: string) => {
  return new FrameExpr([
    new FrameString(prefix),
    FrameSymbol.here(),
    new FrameString(suffix),
  ]);
}

const tag_lazy = (contents: FrameString) => {
  return new FrameExpr([
    wrap_args("<",">"),
    new FrameLazy(FrameSymbol.here()),
    wrap_args("</",">"),
  ]);
};
