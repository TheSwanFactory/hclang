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
