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
}

/** Finite equality type with delegation to nested first-class types. */
export class EnumerationSchemaMatcher implements SchemaMatcher {
  public match(
    schema: FrameList,
    value: Frame,
    origin: Frame,
  ): MatchResult {
    const candidates = schema.asArray();
    if (candidates.length === 0) return matchSuccess(value);

    for (const candidate of candidates) {
      if (isFrameMatcher(candidate)) {
        if (
          !Object.is(candidate, schema) &&
          candidate.match(value, origin).matched
        ) {
          return matchSuccess(value);
        }
      } else if (candidate.isEqualTo(value)) {
        return matchSuccess(value);
      }
    }

    return matchFailure(
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
    result.string_open() !== "[" && result.size() === 1
  ) {
    result = result.asArray()[0];
  }
  return result;
}
