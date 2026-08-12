import type { Frame } from "../frames.ts";

/**
 * Stateless boundary between source symbols and the active lexical receiver.
 *
 * The initial pass is intentionally behavior-preserving: it forwards each
 * symbol and returns the receiver-selected monadic state. Syntax-specific
 * recognition belongs to the receiving Frame, never to this phase.
 */
export class Sigilizer {
  public scan(receiver: Frame, symbol: Frame): Frame {
    return receiver.scan(symbol);
  }
}

export const sigilizer = new Sigilizer();
