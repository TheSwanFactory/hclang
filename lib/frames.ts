import { Frame } from "./frames/frame.ts";
import { Ops } from "./ops.ts";

export { FrameAlias } from "./frames/frame-alias.ts";
export { FrameArray } from "./frames/frame-array.ts";
export { FrameAtom } from "./frames/frame-atom.ts";
export {
  type CharacterContent,
  FrameText,
  hasCharacterContent,
} from "./frames/frame-text.ts";
export { FrameArg, FrameParam } from "./frames/frame-arg.ts";
export { FrameBlob } from "./frames/frame-blob.ts";
export { FrameBytePayload, FrameBytes } from "./frames/frame-bytes.ts";
export { FrameComment } from "./frames/frame-comment.ts";
export { FrameDoc } from "./frames/frame-doc.ts";
export { FrameBind, FrameExpr } from "./frames/frame-expr.ts";
// Evaluation scope is interpreter-internal: `EvaluationInput` appears in the
// `Frame.in` signature, so the type is re-exported here for implementors and
// tests, while `WriteTargetRole` stays private to the scope module.
export {
  type EvaluationInput,
  EvaluationScope,
} from "./frames/evaluation-scope.ts";
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
export {
  FrameScopeAnchor,
  type ScopeAnchorKind,
} from "./frames/frame-scope-anchor.ts";
export { FrameNumeric, type NumericRank } from "./frames/frame-numeric.ts";
export { FrameInt } from "./frames/frame-int.ts";
export { FrameDecimal } from "./frames/frame-decimal.ts";
export { FrameSequence } from "./frames/frame-sequence.ts";
export { FrameTypedNumber } from "./frames/frame-typed-number.ts";
export { FrameRational } from "./frames/frame-rational.ts";
export { FrameNumber } from "./frames/frame-number.ts";
export { FrameSchema } from "./frames/frame-schema.ts";
export { FrameString, FrameStringEnd } from "./frames/frame-string.ts";
export {
  type FrameBinding,
  FrameLiteral,
  FrameOperator,
  FrameSymbol,
} from "./frames/frame-symbol.ts";
export { FrameType } from "./frames/frame-type.ts";
export { FrameURI } from "./frames/frame-uri.ts";
export { FrameResource } from "./frames/frame-resource.ts";
export {
  isResourceBinding,
  RESOURCE_ROOT_KEY,
  type ResourceBinding,
} from "./frames/resource-binding.ts";
export {
  containsResolved,
  decomposeReference,
  joinNormalized,
  type Normalization,
  normalizeReference,
  type ReferenceParts,
  URI_PART_KEYS,
  type URIPartKey,
} from "./frames/resource-reference.ts";
export {
  MemoryStore,
  type ResourceStore,
  type StoreResult,
} from "./frames/resource-store.ts";
export {
  type Any,
  type EvaluationRoots,
  type Flags,
  Frame,
} from "./frames/frame.ts";
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
