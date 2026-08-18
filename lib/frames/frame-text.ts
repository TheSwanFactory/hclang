/**
 * Storage shared by every delimited value whose body is text.
 *
 * Strings, documents, comments, and resource identifiers all hold characters and
 * render them through their own delimiters. Holding that body once, here, keeps
 * the four families siblings rather than making one a subclass of another for
 * the sake of reuse.
 *
 * Storage is not coercion. Contributing raw characters to a larger string is a
 * separate capability, declared below and advertised only by the families whose
 * body is character data in its own right. A comment or a resource identifier
 * keeps its delimiters when it joins a string, so neither implements it.
 *
 * @module
 */
import { FrameQuote } from "./frame-atom.ts";
import { type Context, NilContext } from "./context.ts";
import type { Frame } from "./frame.ts";

export abstract class FrameText extends FrameQuote {
  protected constructor(
    protected readonly data: string,
    meta: Context = NilContext,
  ) {
    super(meta);
  }

  protected override toData(): string {
    return this.data;
  }
}

/**
 * A value that contributes its characters, not its spelling, to a string.
 *
 * Juxtaposition concatenates character content, so `“a” “b”` joins two bodies.
 * Values that merely contain text, such as a comment, are not character content
 * and join as they are written.
 */
export interface CharacterContent {
  /** The characters this value contributes, without its delimiters. */
  characterContent(): string;
}

export const hasCharacterContent = (
  frame: Frame,
): frame is Frame & CharacterContent =>
  "characterContent" in frame && frame.characterContent instanceof Function;
