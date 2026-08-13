import { Frame } from "./frame.ts";
import { FrameArray } from "./frame-array.ts";
import { FrameList } from "./frame-list.ts";
import { FrameName } from "./frame-name.ts";
import { matchFailure, type MatchResult, matchSuccess } from "./frame-match.ts";
import {
  type SchemaMatcher,
  UnsupportedSchemaMatcher,
  unwrapSchemaSyntax,
} from "./schema-matcher.ts";

/** Compile a direct-property structural type when names occur at top level. */
export function compileStructuralSchemaMatcher(
  data: Frame[],
): SchemaMatcher | undefined {
  const terms = data.map(unwrapSchemaSyntax);
  const hasName = terms.some((term) => term instanceof FrameName);
  if (!hasName) return undefined;
  if (!terms.every((term) => term instanceof FrameName)) {
    return new UnsupportedSchemaMatcher();
  }
  return new StructuralSchemaMatcher(
    terms.map((term) => (term as FrameName).source),
  );
}

/** Structural membership with ordered projection as its evidence. */
class StructuralSchemaMatcher implements SchemaMatcher {
  public constructor(private readonly names: string[]) {
  }

  public match(
    _schema: FrameList,
    value: Frame,
    origin: Frame,
  ): MatchResult {
    if (value.meta_length() === 0) {
      return matchFailure(
        Frame.error(`$!.selector-input-invalid ${value.toString()}`),
      );
    }
    const evidence: Frame[] = [];
    for (const name of this.names) {
      const binding = value.resolve_here(name, origin);
      if (binding?.value.is.error) return matchFailure(binding.value);
      if (!binding) {
        return matchFailure(Frame.error(`$!.property-missing .${name}`));
      }
      evidence.push(binding.value);
    }
    return matchSuccess(new FrameArray(evidence));
  }

  public format(): string {
    return `<${this.names.map((name) => `.${name}`).join(", ")}>`;
  }
}
