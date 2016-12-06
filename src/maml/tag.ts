import { FrameExpr, FrameString } from "../frames";

export const tag = (name: string) => {
  return new FrameExpr([
    new FrameString(`<${name}>`),
  ]);
};
