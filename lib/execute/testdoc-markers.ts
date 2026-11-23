/**
 * The line prefixes of an HC testdoc example.
 *
 * A testdoc pairs a source line, which begins with `SOURCE_PREFIX`, with the
 * expectation line after it, which begins with `EXPECT_PREFIX`. The evaluator
 * records both (`HCEval.SOURCE` and `HCEval.EXPECT`), an import drops the
 * example lines (`resource-import.ts`), and the testdoc runner discovers files
 * by them (`cli/test-docs.ts`). This module imports nothing, so any of them can
 * read it.
 *
 * @module
 */

/** The prefix of a testdoc source line, the example to evaluate. */
export const SOURCE_PREFIX = "; ";

/** The prefix of a testdoc expectation line, the result the example answers. */
export const EXPECT_PREFIX = "# ";
