import type { Frame } from "./frames/frame.ts";

export type LexicalMode = "atom" | "document" | "push" | "pop";

export interface SigilStart {
  readonly key: string;
  readonly mode: LexicalMode;
}

export enum ScanDisposition {
  Consume = "consume",
  CompleteConsume = "complete-consume",
  CompleteRedispatch = "complete-redispatch",
  Transition = "transition",
  Error = "error",
}

export interface ScanResult {
  readonly disposition: ScanDisposition;
  readonly frame?: Frame;
  readonly message?: string;
}

export type ScanResponse = Frame | ScanResult;
