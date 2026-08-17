/**
 * Shared protocol between syntax-owning Frames and the stateless Sigilizer.
 *
 * Frames retain any input-dependent lexical state. For each source Symbol they
 * either return the next Frame directly or a plain `ScanResult` telling the
 * Sigilizer how to route consumption, completion, transition, or failure.
 *
 * @module
 */
import type { Frame } from "./frames/frame.ts";

/** The lexical path selected by a syntax class's static `SIGIL_STARTS`. */
export type LexicalMode = "atom" | "run" | "push" | "pop";

/** Class-level registration for one source prefix and its lexical path. */
export interface SigilStart {
  /** The exact source character that selects this syntax participant. */
  readonly key: string;
  /**
   * Whether the participant begins a single-delimiter atom, a run-delimited
   * value whose run length selects nesting depth, or a structural action.
   */
  readonly mode: LexicalMode;
}

/** Generic routing decisions understood by Sigilizer. */
export enum ScanDisposition {
  /** Add the current Symbol to the active lexical receiver. */
  Consume = "consume",
  /** Complete the active receiver and consume the current Symbol. */
  CompleteConsume = "complete-consume",
  /** Complete the active receiver and scan the Symbol again from its parent. */
  CompleteRedispatch = "complete-redispatch",
  /** Install the supplied syntax-specific receiver and consume the Symbol. */
  Transition = "transition",
  /** Convert the decision into a lexical error Frame. */
  Error = "error",
}

/** A stateless routing decision returned by `Frame.scan()` or `finishInput()`. */
export interface ScanResult {
  /** The generic action Sigilizer should perform. */
  readonly disposition: ScanDisposition;
  /** Completed value or next lexical receiver, when the disposition needs one. */
  readonly frame?: Frame;
  /** Human-readable detail for an `Error` disposition. */
  readonly message?: string;
}

/** A direct next receiver or a decision for Sigilizer to route. */
export type ScanResponse = Frame | ScanResult;

/**
 * Class-side registration shared by every syntax family.
 *
 * A family registers this descriptor, never a runtime constructor. Recognition
 * is a property of the family; construction is a property of the value.
 */
export interface SyntaxFacet {
  /** Stable name used for lexer identity and diagnostics. */
  readonly NAME: string;
  /** Source characters and lexical modes that select this family. */
  readonly SIGIL_STARTS: readonly SigilStart[];
}

/**
 * Recognition and construction for a single-delimiter (`atom`) family.
 *
 * Recognition is stateless: it reads the Symbol, the lexeme accumulated so far,
 * and the live evaluation context, never a partially built value. A family
 * whose values never come from source may throw from `fromSource()` rather than
 * accept a placeholder.
 */
export interface AtomSyntax extends SyntaxFacet {
  /**
   * Decide what the active lexeme does with one source Symbol.
   *
   * A descriptor is not a receiver, so it returns a decision and never itself.
   */
  recognize(symbol: Frame, source: string, context: Frame): ScanResult;
  /** Resolve the active lexeme at physical end-of-input. */
  finish(source: string): ScanResult;
  /** Build one runtime value from its completed source body. */
  fromSource(source: string): Frame;
}

/** Registration for a family whose maximal run length selects nesting depth. */
export interface RunSyntax extends SyntaxFacet {
  /** The character whose maximal runs delimit this family. */
  readonly RUN_DELIMITER: string;
  /** Adjective naming this family in lexical diagnostics. */
  readonly RUN_LABEL: string;
  /**
   * Whether the body is foreign content rather than HC source.
   *
   * Opaque bodies own their own line conventions, so HC does not look for
   * prompt markers inside them.
   */
  readonly RUN_OPAQUE: boolean;
  /** Build one completed value from its body and classified run length. */
  fromRun(body: string, runLength: number): Frame;
}
