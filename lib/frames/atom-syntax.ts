/**
 * Shared class-side lexical recognizers.
 *
 * Recognition is a property of a syntax family, not of any value: every rule
 * here is a pure function of the current Symbol and the lexeme accumulated so
 * far. Families compose these helpers into their static `SYNTAX` descriptor, so
 * no family needs a receiver class and none needs a placeholder value.
 *
 * @module
 */
import { ScanDisposition, type ScanResult } from "../scan.ts";

/** A stateless end-of-input rule, as required by `AtomSyntax.finish`. */
export type Finisher = (source?: string) => ScanResult;

/** Counts non-overlapping occurrences of `token` in `source`. */
const occurrences = (source: string, token: string): number =>
  source.split(token).length - 1;

/** Consume an accepted character; otherwise end the atom before it. */
export const includeOrEnd = (included: boolean): ScanResult => ({
  disposition: included
    ? ScanDisposition.Consume
    : ScanDisposition.CompleteRedispatch,
});

/** End-of-input rule for an atom that ends wherever the source ends. */
export const completeAtEnd = (): ScanResult => ({
  disposition: ScanDisposition.CompleteRedispatch,
});

/**
 * Unclosed interior prefixes already consumed into `source`.
 *
 * Symmetric delimiters cannot nest, so they are always at depth zero.
 */
export const nestingDepth = (
  source: string,
  prefix: string,
  suffix: string,
): number =>
  prefix === "" || prefix === suffix
    ? 0
    : occurrences(source, prefix) - occurrences(source, suffix);

/** End-of-input rule for a delimited atom that must be closed. */
export const unterminatedAtEnd = (
  name: string,
  prefix: string,
): Finisher =>
(source = ""): ScanResult => ({
  disposition: ScanDisposition.Error,
  message: `unterminated ${name}: ${prefix}${source}`,
});
