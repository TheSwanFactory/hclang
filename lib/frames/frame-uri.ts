import { FrameText } from "./frame-text.ts";
import { FrameString } from "./frame-string.ts";
import { type Context, NilContext } from "./context.ts";
import { Frame } from "./frame.ts";
import { unterminatedAtEnd } from "./atom-syntax.ts";
import { type EvaluationInput, EvaluationScope } from "./evaluation-scope.ts";
import { isResourceBinding, RESOURCE_ROOT_KEY } from "./resource-binding.ts";
import { decomposeReference, URI_PART_KEYS } from "./resource-reference.ts";
import {
  type AtomSyntax,
  ScanDisposition,
  type ScanResult,
  type SigilStart,
} from "../scan.ts";

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
 * structured, comparable, printable, powerless URI reference.
 *
 * Evaluation binds that identity to whatever authority the invocation context
 * already carries. When a root binding is reachable, `'…'` evaluates to a
 * `FrameResource` extending it; when none is, it evaluates to itself and stays
 * powerless. Either way nothing is accessed, so the same source text yields a
 * different result under different ambient authority without the lexer ever
 * becoming an authority-granting construct.
 *
 * Delimiters are symmetric, so a resource identifier never nests. Its content
 * must be URI-shaped, which turns an English apostrophe into a fast lexical
 * error instead of a silently swallowed remainder.
 */
export class FrameURI extends FrameText {
  public static readonly URI_BEGIN = "'";
  public static readonly URI_END = "'";
  public static readonly SIGIL_STARTS: readonly SigilStart[] = [
    { key: FrameURI.URI_BEGIN, mode: "atom" },
  ];
  /** Component names published as metadata for every decomposed reference. */
  public static readonly PART_KEYS = URI_PART_KEYS;

  public static readonly SYNTAX: AtomSyntax = {
    NAME: "FrameURI",
    SIGIL_STARTS: FrameURI.SIGIL_STARTS,
    recognize: recognizeReference,
    finish: unterminatedAtEnd("FrameURI", FrameURI.URI_BEGIN),
    fromSource: (source: string): Frame => new FrameURI(source),
  };

  constructor(data: string, meta: Context = NilContext) {
    super(data, meta);
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

  /**
   * Binds this identity to the authority the context already carries.
   *
   * A resource identifier is not a lookup: this resolves the root binding, not
   * the reference. With no root binding reachable the identifier evaluates to
   * itself, which is the powerless case and the default everywhere the harness
   * has installed nothing.
   */
  public override in(input: EvaluationInput = []): Frame {
    const root = EvaluationScope.from(input).hostNamespace.get_here(
      RESOURCE_ROOT_KEY,
    );
    return isResourceBinding(root) ? root.extend(this.data) : this;
  }

  /** Publishes URI components as ordinary readable properties. */
  private decompose(): void {
    const parts = decomposeReference(this.data);
    FrameURI.PART_KEYS.forEach((key) => {
      const value = parts[key];
      if (value !== undefined) {
        this.set(key, new FrameString(value));
      }
    });
  }
}
