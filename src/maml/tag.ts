import { Frame, FrameExpr, FrameString } from "../frames";

export const tag = (name: string, body: Frame) => {
  return new FrameExpr([
    new FrameString(`<${name}>`),
    body,
    new FrameString(`</${name}>`),
  ]);
};
