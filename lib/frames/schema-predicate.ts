/**
 * Installs predicate schema candidates (#536): a closure inside a schema, a
 * `FrameLazy` or a `BoundMethod` (a closure read by dot), possibly behind a
 * handle, is a predicate. Its effect is graded by its potential access
 * footprint (access-footprint.ts); any write makes it effectful. That walk
 * cannot see a write reached through the matched value or through closures
 * held in an aggregate, so each call also runs under an `AccessRecord` guard
 * that refuses writes to shared state before they land. It lives
 * here because schema-matcher.ts is imported by frame.ts and cannot import
 * the closure or footprint machinery.
 */
import { FrameLazy } from "./frame-lazy.ts";
import { Frame } from "./frame.ts";
import { BoundMethod } from "./bound-method.ts";
import { isState, potentialFootprint } from "./access-footprint.ts";
import {
  AccessRecord,
  UncertifiedAccess,
  withAccessRecord,
} from "./reference-tracking.ts";
import { installSchemaPredicates } from "./schema-matcher.ts";

/** Both schema construction and matching refuse writes to existing state. */
function readOnlySchema(action: () => Frame): Frame {
  const record = new AccessRecord();
  record.guard = (frame, access) => access !== "write" || !isState(frame);
  try {
    return withAccessRecord(record, action);
  } catch (error) {
    // A refusal by an enclosing record belongs to whoever installed it.
    if (!(error instanceof UncertifiedAccess) || error.record !== record) {
      throw error;
    }
    return Frame.error("$!.schema-predicate-effect");
  }
}

installSchemaPredicates({
  predicateOf: (candidate) => {
    const target = candidate.referent();
    return target instanceof FrameLazy || target instanceof BoundMethod
      ? target
      : undefined;
  },
  hasEffect: (predicate) =>
    potentialFootprint(predicate, Frame.nil).writes.size > 0,
  call: (predicate, value) =>
    readOnlySchema(() => predicate.call(value, Frame.nil)),
  evaluate: (term, input) => readOnlySchema(() => term.in(input)),
});
