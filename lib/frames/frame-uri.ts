import { FrameQuote } from "./frame-atom.ts";
import { FrameString } from "./frame-string.ts";
import { type Context, NilContext } from "./context.ts";
import { Frame } from "./frame.ts";
import { unterminatedAtEnd } from "./atom-syntax.ts";
import {
  type AtomSyntax,
  ScanDisposition,
  type ScanResult,
  type SigilStart,
} from "../scan.ts";

/** RFC 3986 Appendix B decomposition of a URI reference. */
const URI_REFERENCE =
  /^(?:([^:/?#]+):)?(?:\/\/([^/?#]*))?([^?#]*)(?:\?([^#]*))?(?:#(.*))?$/;

/** Characters a URI reference cannot contain, so an apostrophe fails fast. */
const URI_EXCLUDED = /[\s<>"“”`\\^{}|]/;

/** Rejects non-URI content while the offending character is still local. */
const recognizeReference = (symbol: Frame, source = ""): ScanResult => {
  const char = symbol.toString();
  if (char === FrameURI.URI_END) {
    if (source === "") {
      return {
        disposition: ScanDisposition.Error,
        message: "empty resource identifier: ''",
      };
    }
    return { disposition: ScanDisposition.CompleteConsume };
  }
  if (URI_EXCLUDED.test(char)) {
    const opened = `${FrameURI.URI_BEGIN}${source}`;
    return {
      disposition: ScanDisposition.Error,
      message: /\s/.test(char)
        ? `unterminated resource identifier: ${opened}`
        : `invalid resource identifier: ${opened}${char}`,
    };
  }
  return { disposition: ScanDisposition.Consume };
};

/**
 * Inert name for a resource outside the program.
 *
 * `'…'` denotes an identity, never an authority. Lexing and evaluating one
 * performs no network, filesystem, or registry access: the value is a
 * structured, comparable, printable, powerless URI reference. Resolution
 * happens only when a constructed resource Frame reachable in the invocation
 * context is applied to it, so the same source text under different ambient
 * authority yields a different result.
 *
 * Delimiters are symmetric, so a resource identifier never nests. Its content
 * must be URI-shaped, which turns an English apostrophe into a fast lexical
 * error instead of a silently swallowed remainder.
 */
export class FrameURI extends FrameQuote {
  public static readonly URI_BEGIN = "'";
  public static readonly URI_END = "'";
  public static readonly SIGIL_STARTS: readonly SigilStart[] = [
    { key: FrameURI.URI_BEGIN, mode: "atom" },
  ];
  /** Component names published as metadata for every decomposed reference. */
  public static readonly PART_KEYS = [
    "scheme",
    "authority",
    "path",
    "query",
    "fragment",
  ] as const;

  public static readonly SYNTAX: AtomSyntax = {
    NAME: "FrameURI",
    SIGIL_STARTS: FrameURI.SIGIL_STARTS,
    recognize: recognizeReference,
    finish: unterminatedAtEnd("FrameURI", FrameURI.URI_BEGIN),
    fromSource: (source: string): Frame => new FrameURI(source),
  };

  constructor(protected data: string, meta: Context = NilContext) {
    super(meta);
    this.decompose();
  }

  public override string_prefix(): string {
    return FrameURI.URI_BEGIN;
  }

  public override string_suffix(): string {
    return FrameURI.URI_END;
  }

  /** The delimited reference, unchanged by decomposition. */
  public override toString(): string {
    return this.toStringData();
  }

  /** Resource identifiers are values, not lookups. */
  public override in(_contexts = [Frame.nil]): Frame {
    return this;
  }

  protected override toData(): string {
    return this.data;
  }

  /** Publishes URI components as ordinary readable properties. */
  private decompose(): void {
    const parts = URI_REFERENCE.exec(this.data);
    if (parts === null) {
      return;
    }
    FrameURI.PART_KEYS.forEach((key, index) => {
      const value = parts[index + 1];
      if (value !== undefined && value !== "") {
        this.set(key, new FrameString(value));
      }
    });
  }
}
