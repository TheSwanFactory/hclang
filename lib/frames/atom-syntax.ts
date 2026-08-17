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
import type { Frame } from "./frame.ts";
import { ScanDisposition, type ScanResult } from "../scan.ts";

/** Whether one character belongs to the spelling of an atom. */
export type IncludeRule = (char: string) => boolean;

/** A stateless recognition rule, as required by `AtomSyntax.recognize`. */
export type Recognizer = (symbol: Frame, source?: string) => ScanResult;

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

/** Recognition for an atom spelled as a run of accepted characters. */
export const includeRecognizer =
  (include: IncludeRule): Recognizer => (symbol: Frame): ScanResult =>
    includeOrEnd(include(symbol.toString()));

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

/**
 * Recognition for an atom delimited by an explicit prefix and suffix.
 *
 * Asymmetric delimiters nest without an escape character: an interior prefix
 * increments depth, an interior suffix decrements it, and only a suffix at depth
 * zero completes the atom.
 */
export const quoteRecognizer = (
  prefix: string,
  suffix: string,
): Recognizer =>
(symbol: Frame, source = ""): ScanResult => {
  if (symbol.toString() !== suffix) {
    return { disposition: ScanDisposition.Consume };
  }
  return {
    disposition: nestingDepth(source, prefix, suffix) > 0
      ? ScanDisposition.Consume
      : ScanDisposition.CompleteConsume,
  };
};

/** End-of-input rule for a delimited atom that must be closed. */
export const unterminatedAtEnd = (
  name: string,
  prefix: string,
): Finisher =>
(source = ""): ScanResult => ({
  disposition: ScanDisposition.Error,
  message: `unterminated ${name}: ${prefix}${source}`,
});
