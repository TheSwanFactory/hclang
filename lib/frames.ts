import { Frame } from "./frames/frame.ts";
import { Ops } from "./ops.ts";

export { FrameAlias } from "./frames/frame-alias.ts";
export { FrameArray } from "./frames/frame-array.ts";
export { FrameAtom } from "./frames/frame-atom.ts";
export { FrameText, hasCharacterContent } from "./frames/frame-text.ts";
export { FrameArg, FrameParam } from "./frames/frame-arg.ts";
export { FrameBlob } from "./frames/frame-blob.ts";
export { FrameBytePayload, FrameBytes } from "./frames/frame-bytes.ts";
export { FrameComment } from "./frames/frame-comment.ts";
export { FrameDoc } from "./frames/frame-doc.ts";
export { FrameBind, FrameExpr, FrameScoped } from "./frames/frame-expr.ts";
// Evaluation scope is interpreter-internal: `EvaluationInput` appears in the
// `Frame.in` signature, so the type is re-exported here for implementors and
// tests, while `WriteTargetRole` stays private to the scope module.
export {
  type EvaluationInput,
  EvaluationScope,
} from "./frames/evaluation-scope.ts";
export { FrameGroup } from "./frames/frame-group.ts";
export {
  FrameImport,
  type ImportSourceEvaluator,
  type ImportTarget,
} from "./frames/frame-import.ts";
export { FrameLazy } from "./frames/frame-lazy.ts";
import "./frames/frame-match.ts";
export { type IArrayConstructor } from "./frames/frame-list.ts";
export { FrameName } from "./frames/frame-name.ts";
export { FrameWord } from "./frames/frame-word.ts";
export { FrameNote } from "./frames/frame-note.ts";
export { FrameScopeAnchor } from "./frames/frame-scope-anchor.ts";
export { FrameObservation } from "./frames/frame-observation.ts";
export { FrameNumeric, NUMERIC_RANK } from "./frames/frame-numeric.ts";
export { FrameInt } from "./frames/frame-int.ts";
export { FrameCount } from "./frames/frame-count.ts";
export {
  installDenumConstructor,
  installRouterRecognizer,
} from "./frames/fourth-hash.ts";
export { FrameDecimal } from "./frames/frame-decimal.ts";
export { FrameSequence } from "./frames/frame-sequence.ts";
export { FrameTypedNumber } from "./frames/frame-typed-number.ts";
export {
  type DimensionalKind,
  dimensionalResult,
} from "./frames/dimensional-algebra.ts";
export {
  FrameDateTime,
  FrameDuration,
  FrameTime,
  parseTimeLiteral,
} from "./frames/frame-time.ts";
export {
  BudgetClock,
  type Clock,
  CLOCK_SCHEME,
  ClockHandler,
  FrozenClock,
  RealClock,
  ScriptedClock,
} from "./frames/clock.ts";
export { FrameRational } from "./frames/frame-rational.ts";
export { FrameNumber } from "./frames/frame-number.ts";
export { FrameSchema } from "./frames/frame-schema.ts";
export { FrameString, FrameStringEnd } from "./frames/frame-string.ts";
export {
  FrameLiteral,
  FrameOperator,
  FrameSymbol,
} from "./frames/frame-symbol.ts";
export { FrameType } from "./frames/frame-type.ts";
export { FrameURI } from "./frames/frame-uri.ts";
export { FrameResource } from "./frames/frame-resource.ts";
export { RESOURCE_ROOT_KEY } from "./frames/resource-binding.ts";
export {
  containsResolved,
  decomposeReference,
  joinNormalized,
  normalizeReference,
} from "./frames/resource-reference.ts";
export {
  characterElements,
  type HandlerRead,
  type HandlerWrite,
  ResourceHandlers,
  type SchemeHandler,
  StoreHandler,
} from "./frames/resource-handlers.ts";
export {
  MemoryStore,
  ResourceMapStore,
  type ResourceStore,
  type StoreResult,
} from "./frames/resource-store.ts";
export {
  type Any,
  type EvaluationRoots,
  type Flags,
  Frame,
} from "./frames/frame.ts";
export { type ISourced, MetaFrame } from "./frames/meta-frame.ts";
export { ScanDisposition, type ScanResult } from "./scan.ts";
export {
  type Context,
  contextEqual,
  contextString,
  type IKeyValuePair,
  NilContext,
  type StringMap,
} from "./frames/context.ts";
import "./frames/effect-registry.ts";
import "./frames/reference-tracking.ts";
import "./frames/access-footprint.ts";
import "./frames/event-dispatch.ts";
export { DISPATCH_KEY, dispatchNamespace } from "./frames/dispatch-host.ts";
import "./frames/bound-method.ts";
import "./frames/frame-handle.ts";
export {
  checkPartitions,
  type DependencyEdge,
  type DependencyKind,
  type PartitionCheckResult,
  type PartitionError,
  type PartitionPlan,
  partitionPlan,
} from "./frames/partition-check.ts";
Frame.globals = Ops;
