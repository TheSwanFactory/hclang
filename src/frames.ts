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
export { FrameList } from "./frames/frame-list.ts";
export type { IArrayConstructor } from "./frames/frame-list.ts";
export { FrameName } from "./frames/frame-name.ts";
export { FrameNote } from "./frames/frame-note.ts";
export { FrameNumber } from "./frames/frame-number.ts";
export { FrameSchema } from "./frames/frame-schema.ts";
export { FrameString } from "./frames/frame-string.ts";
export type { IStringConstructor } from "./frames/frame-string.ts";
export { FrameOperator, FrameSymbol } from "./frames/frame-symbol.ts";
export { Frame } from "./frames/frame.ts";
export type { Any } from "./frames/frame.ts";
export {
  contextEqual,
  contextString,
  MetaFrame,
  NilContext,
} from "./frames/meta-frame.ts";
export type { Context, IKeyValuePair, ISourced } from "./frames/meta-frame.ts";
Frame.globals = Ops;
