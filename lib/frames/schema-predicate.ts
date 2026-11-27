/**
 * Installs predicate schema candidates (#536): a closure inside a schema, a
 * `FrameLazy` or a `BoundMethod` (a closure read by dot), possibly behind a
 * handle, is a predicate. Its effect is graded by its potential access
 * footprint (access-footprint.ts); any write makes it effectful. It lives
 * here because schema-matcher.ts is imported by frame.ts and cannot import
 * the closure or footprint machinery.
 */
import { FrameLazy } from "./frame-lazy.ts";
import { Frame } from "./frame.ts";
import { BoundMethod } from "./bound-method.ts";
import { potentialFootprint } from "./access-footprint.ts";
import { installSchemaPredicates } from "./schema-matcher.ts";

installSchemaPredicates({
  predicateOf: (candidate) => {
    const target = candidate.referent();
    return target instanceof FrameLazy || target instanceof BoundMethod
      ? target
      : undefined;
  },
  hasEffect: (predicate) =>
    potentialFootprint(predicate, Frame.nil).writes.size > 0,
});
