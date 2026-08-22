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

/** The sigil that opens a scope anchor, reserved at identifier boundaries. */
const ANCHOR_SIGIL = "$";

/** An identifier continuation, which an anchor may never abut. */
const IDENTIFIER_CHAR = /[-\w]/;

/**
 * Continue a word-shaped atom, or refuse an anchor that would abut it.
 *
 * `$` and `$$` name an evaluation root only at a token boundary, so an anchor
 * touching an identifier continuation is a lexical error rather than a silent
 * split into two adjacent tokens. Every family whose lexeme can end in `\w` or
 * `-` routes continuation through here, so `name$`, `1$`, `0b1$`, `@ctl$`, and
 * `.set$` all fail alike while `@$`, `.$`, and `.+$` stay boundary-legal.
 *
 * `lexeme` is the spelling so far including any sigil the family consumed
 * before its body, since that sigil can itself be the preceding character.
 */
export const includeOrReserve = (
  char: string,
  included: boolean,
  lexeme: string,
): ScanResult =>
  char === ANCHOR_SIGIL && IDENTIFIER_CHAR.test(lexeme.slice(-1))
    ? {
      disposition: ScanDisposition.Error,
      message: `invalid dollar form: ${lexeme}${char}`,
    }
    : includeOrEnd(included);

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
