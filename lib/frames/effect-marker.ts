/**
 * The one spelling rule for HC's effect axis.
 *
 * A trailing underscore on a key means the key touches identity: a name spelled
 * that way denotes a mutable handle on its value, and a method declared that way
 * may write the receiver it runs against. HC previously spelled the two halves
 * differently — `counter_` for the handle, `.set:` for the method — which forced
 * the lexer to carve a mutating colon out of the if-else operator. One marker
 * needs no such carve-out, so `:` denotes if-else and nothing else.
 *
 * Spelling is graded here and nowhere else. Both consumers, `FrameHandle` and
 * `BoundMethod`, receive the answer as a declared fact rather than re-reading a
 * key at effect time.
 *
 * @module
 */

/** The suffix by which a key claims authority over its target's identity. */
export const EFFECT_MARKER = "_";

/** Whether this key's spelling claims authority over its target's identity. */
export const touchesIdentity = (key: string): boolean =>
  key.endsWith(EFFECT_MARKER);

/** What a declared key says about the method bound to it. */
export interface MethodEffect {
  /** The declared name without its marker, naming a diagnostic's subject. */
  readonly name: string;
  /** Whether the declaration may write the receiver it runs against. */
  readonly mutating: boolean;
}

/** Grades one declared key, the single point where the marker is read. */
export const methodEffect = (key: string): MethodEffect => {
  const mutating = touchesIdentity(key);
  return {
    name: mutating ? key.slice(0, -EFFECT_MARKER.length) : key,
    mutating,
  };
};
