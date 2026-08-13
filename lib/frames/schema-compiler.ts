import type { Frame } from "./frame.ts";
import { compileBitSchemaMatcher } from "./schema-bit-matcher.ts";
import type { SchemaMatcher } from "./schema-matcher.ts";
import { compileStructuralSchemaMatcher } from "./schema-structural-matcher.ts";

/** Select an extensible domain matcher; undefined means ordinary enumeration. */
export function compileSchemaMatcher(
  data: Frame[],
): SchemaMatcher | undefined {
  return compileStructuralSchemaMatcher(data) ??
    compileBitSchemaMatcher(data);
}
