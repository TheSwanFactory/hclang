import { FrameAtom } from "./frame-atom.ts";
import { NilContext } from "./context.ts";

/**
 * A word: an atom of source held as data, which never resolves (#429).
 *
 * Walking a closure with `&` yields its body as syntax. A symbol in that body
 * cannot be yielded as the symbol itself, because a symbol in value position
 * is a pending lookup: the moment it is indexed, compared, or collected into
 * an aggregate it is looked up again, in whatever scope it happens to be in.
 * A word is the name instead. It prints as it was written, `a` for a lookup
 * and `.a` for a declaration, so the walk's text re-reads as the same source,
 * and `=` compares that spelling.
 *
 * A word answers nothing about the value its spelling would name, and it is
 * not an operator, so a walked `+` is an element like any other.
 */
export class FrameWord extends FrameAtom {
  constructor(
    protected data: string,
    private readonly dotted: boolean,
    meta = NilContext,
  ) {
    super(meta);
  }

  /** The word for a lookup, `a`, or an operator, `+`. */
  public static word(spelling: string): FrameWord {
    return new FrameWord(spelling, false);
  }

  /** The word for a declaration or address, `.a`. */
  public static address(spelling: string): FrameWord {
    return new FrameWord(spelling, true);
  }

  public override string_prefix(): string {
    return this.dotted ? "." : "";
  }

  protected override toData(): string {
    return this.data;
  }
}
