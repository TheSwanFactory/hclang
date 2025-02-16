import { Frame } from "./frames/frame.ts";
import { Ops } from "./ops.ts";

export { FrameAlias } from "./frames/frame-alias.ts";
export { FrameArray } from "./frames/frame-array.ts";
export { FrameAtom, FrameQuote } from "./frames/frame-atom.ts";
export { FrameArg, FrameParam } from "./frames/frame-arg.ts";
export { FrameBlob } from "./frames/frame-blob.ts";
export { FrameBytes } from "./frames/frame-bytes.ts";
export { FrameComment } from "./frames/frame-comment.ts";
export { FrameDoc } from "./frames/frame-doc.ts";
export { FrameBind, FrameExpr } from "./frames/frame-expr.ts";
export { FrameGroup } from "./frames/frame-group.ts";
export { FrameLazy } from "./frames/frame-lazy.ts";
export { FrameList, type IArrayConstructor } from "./frames/frame-list.ts";
export { FrameName } from "./frames/frame-name.ts";
export { FrameNote } from "./frames/frame-note.ts";
export { FrameNumber } from "./frames/frame-number.ts";
export { FrameSchema } from "./frames/frame-schema.ts";
export { FrameString, type IStringConstructor } from "./frames/frame-string.ts";
export { FrameOperator, FrameSymbol } from "./frames/frame-symbol.ts";
export { type Any, Frame } from "./frames/frame.ts";
export {
  type ISourced,
  MetaFrame,
  NilContext,
} from "./frames/meta-frame.ts";
export { contextEqual, contextString, type Context, type IKeyValuePair } from "./frames/context.ts";
Frame.globals = Ops;
