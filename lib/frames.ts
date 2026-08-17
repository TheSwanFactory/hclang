import { Frame } from "./frames/frame.ts";
import { Ops } from "./ops.ts";

export { FrameAlias } from "./frames/frame-alias.ts";
export { FrameArray } from "./frames/frame-array.ts";
export { FrameAtom, FrameQuote } from "./frames/frame-atom.ts";
export { FrameArg, FrameParam } from "./frames/frame-arg.ts";
export { FrameBlob } from "./frames/frame-blob.ts";
export { FrameBytePayload, FrameBytes } from "./frames/frame-bytes.ts";
export { FrameComment } from "./frames/frame-comment.ts";
export { FrameDoc } from "./frames/frame-doc.ts";
export { FrameBind, FrameExpr } from "./frames/frame-expr.ts";
export { FrameGroup } from "./frames/frame-group.ts";
export { FrameLazy } from "./frames/frame-lazy.ts";
export {
  type FrameMatcher,
  isFrameMatcher,
  type MatchFailure,
  type MatchResult,
  type MatchSuccess,
} from "./frames/frame-match.ts";
export { FrameList, type IArrayConstructor } from "./frames/frame-list.ts";
export { FrameName } from "./frames/frame-name.ts";
export { FrameNote } from "./frames/frame-note.ts";
export { FrameNumber } from "./frames/frame-number.ts";
export { FrameSchema } from "./frames/frame-schema.ts";
export {
  FrameString,
  FrameStringEnd,
  type IStringConstructor,
} from "./frames/frame-string.ts";
export {
  type FrameBinding,
  FrameLiteral,
  FrameOperator,
  FrameSymbol,
} from "./frames/frame-symbol.ts";
export { FrameType } from "./frames/frame-type.ts";
export { FrameURI } from "./frames/frame-uri.ts";
export { type Any, type Flags, Frame } from "./frames/frame.ts";
export { type ISourced, MetaFrame, Visibility } from "./frames/meta-frame.ts";
export {
  type LexicalMode,
  ScanDisposition,
  type ScanResponse,
  type ScanResult,
  type SigilStart,
} from "./scan.ts";
export {
  type Context,
  contextEqual,
  contextString,
  type IKeyValuePair,
  NilContext,
  type StringMap,
} from "./frames/context.ts";
Frame.globals = Ops;
