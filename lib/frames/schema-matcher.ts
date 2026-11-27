import { Frame } from "./frame.ts";
import { FrameList } from "./frame-list.ts";
import {
  type FrameMatcher,
  isFrameMatcher,
  matchFailure,
  type MatchResult,
  matchSuccess,
} from "./frame-match.ts";

/** Domain-specific interpretation delegated to by a general FrameSchema. */
export interface SchemaMatcher {
  match(schema: FrameList, value: Frame, origin: Frame): MatchResult;
  format?(): string;
  /** Application may construct while membership remains a pure match. */
  apply?(schema: FrameList, value: Frame, origin: Frame): Frame;
  /** Ordered capture values for the constructor direction of reduction. */
  construct?(value: Frame): Frame;
  /** Bit width, or null for a terminal remainder. */
  readonly bits?: number | null;
}

/**
 * How a schema recognizes and grades a predicate candidate: a closure inside
 * the schema (#536). The implementation needs closure and footprint machinery
 * that imports frame.ts, which imports this module through frame-schema.ts, so
 * schema-predicate.ts installs it from lib/frames.ts.
 */
export interface SchemaPredicates {
  /** The callable a candidate denotes when it is a closure, else undefined. */
  predicateOf(candidate: Frame): Frame | undefined;
  /** Whether calling the predicate may write (its footprint has a write). */
  hasEffect(predicate: Frame): boolean;
  /** Calls the predicate with `value`, refusing any write to shared state. */
  call(predicate: Frame, value: Frame): Frame;
}
let predicates: SchemaPredicates | undefined;
export function installSchemaPredicates(p: SchemaPredicates): void {
  predicates = p;
}
/** The predicate a schema candidate denotes; undefined before install. */
export function schemaPredicateOf(candidate: Frame): Frame | undefined {
  return predicates?.predicateOf(candidate);
}
export function schemaPredicateHasEffect(predicate: Frame): boolean {
  return predicates?.hasEffect(predicate) ?? false;
}
export function callSchemaPredicate(predicate: Frame, value: Frame): Frame {
  return predicates
    ? predicates.call(predicate, value)
    : predicate.call(value, Frame.nil);
}
/**
 * Finite equality type with delegation to nested first-class types and
 * predicate candidates. A closure candidate is called with the value and
 * admits it unless it answers nil or an error; when no candidate matches, the
 * first error a predicate answered is the failure's reason (#536). The call
 * runs under a guard that refuses writes to shared state, so a predicate that
 * writes through its argument answers `$!.schema-predicate-effect` instead.
 */
export class EnumerationSchemaMatcher implements SchemaMatcher {
  public match(
    schema: FrameList,
    value: Frame,
    origin: Frame,
  ): MatchResult {
    const candidates = schema.asArray();
    if (candidates.length === 0) return matchSuccess(value);

    let reason: Frame | undefined;
    for (const candidate of candidates) {
      if (isFrameMatcher(candidate)) {
        if (
          !Object.is(candidate, schema) &&
          candidate.match(value, origin).matched
        ) {
          return matchSuccess(value);
        }
        continue;
      }
      const predicate = schemaPredicateOf(candidate);
      if (predicate) {
        const answer = callSchemaPredicate(predicate, value);
        if (answer.is.error === true) reason ??= answer;
        else if (answer !== Frame.nil) return matchSuccess(value);
        continue;
      }
      if (candidate.isEqualTo(value) || value.matchesKind(candidate)) {
        return matchSuccess(value);
      }
    }

    return matchFailure(
      reason ??
        Frame.error(`$!.type-error ${schema.toString()} ${value.toString()}`),
    );
  }
}

/** Explicit capability boundary for a schema shape without a matcher. */
export class UnsupportedSchemaMatcher implements SchemaMatcher {
  public constructor(private readonly source = "$!.unsupported-schema-match") {
  }

  public match(
    _schema: FrameList,
    _value: Frame,
    _origin: Frame,
  ): MatchResult {
    return matchFailure(Frame.error(this.source));
  }
}

export type SchemaFrame = FrameList & FrameMatcher;

export function isSchemaFrame(value: Frame): value is SchemaFrame {
  return value instanceof FrameList && isFrameMatcher(value) &&
    value.string_open() === "<" && value.string_close() === ">";
}

export function unwrapSchemaSyntax(frame: Frame): Frame {
  let result = frame;
  while (
    result instanceof FrameList && !isSchemaFrame(result) &&
    !result.isClosure() &&
    result.string_open() !== "[" && result.size() === 1
  ) {
    result = result.asArray()[0];
  }
  return result;
}
