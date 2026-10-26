import { Frame } from "./frame.ts";
import { FrameAtom } from "./frame-atom.ts";
import { NilContext } from "./context.ts";
import type { EvaluationScope } from "./evaluation-scope.ts";

/**
 * A word: an atom of source held as data, which never resolves (#429).
 *
 * Walking a closure with `&` yields its body as syntax. A symbol in that body
 * cannot be yielded as the symbol itself, because a symbol in value position
 * is a pending lookup: the moment it is indexed, compared, or collected into
 * an aggregate it is looked up again, in whatever scope it happens to be in.
 * A word is the name instead. It prints as it was written, `a` for a lookup
 * and `.a` for a declaration, so the walk's text re-reads as the same source.
 *
 * A word is a name, so `=` compares the name: a lookup `x`, a declaration
 * `.x` and the written name `.x` are all equal. `===` also compares which
 * declaration the name resolves to, so in `{.a 1; {.a 2; a}}` the inner `a`
 * is identical to the inner `.a` and not to the outer one. A free name, one
 * declared nowhere its body can see, resolves per call, so two free words are
 * identical when they are spelled alike.
 *
 * A word answers nothing about the value its spelling would name, and it is
 * not an operator, so a walked `+` is an element like any other. A walk is
 * evaluation stopped before each term's last step, so a word also carries the
 * scope its closure was bound in. The one place words turn back into code is
 * a fold, which resumes them: `|` over a stream that holds a word calls the
 * body it spells with the receiver, and each word resolves after the receiver
 * where its closure would have, so `{x + 1} | (.x 5)` is `6` (spec a17).
 */
export class FrameWord extends FrameAtom {
  constructor(
    protected data: string,
    private readonly dotted: boolean,
    private readonly site?: Frame,
    /** The scope the word's closure was bound in, where it resumes (a17). */
    public readonly scope?: EvaluationScope,
    meta = NilContext,
  ) {
    super(meta);
  }

  /** The word for a lookup, `a`, or an operator, `+`. */
  public static word(
    spelling: string,
    site?: Frame,
    scope?: EvaluationScope,
  ): FrameWord {
    return new FrameWord(spelling, false, site, scope);
  }

  /** The word for a declaration or address, `.a`. */
  public static address(spelling: string, site?: Frame): FrameWord {
    return new FrameWord(spelling, true, site);
  }

  /** The spelling without its dot. */
  public spelling(): string {
    return this.data;
  }

  /** Whether this word was written with a dot, as a declaration or address. */
  public isAddress(): boolean {
    return this.dotted;
  }

  public override string_prefix(): string {
    return this.dotted ? "." : "";
  }

  protected override toData(): string {
    return this.data;
  }

  /** A word equals any name with its spelling: a word, or an address `.x`. */
  public override equals(other: Frame): Frame {
    return nameOf(other.referent()) === this.data ? Frame.all : Frame.nil;
  }

  /** Two words are one name when they resolve to one declaration. */
  public override identical(other: Frame): Frame {
    const right = other.referent();
    return right instanceof FrameWord && right.data === this.data &&
        right.site === this.site
      ? Frame.all
      : Frame.nil;
  }
}

/**
 * The name a frame is, if it is one: a word, or an address symbol, which
 * prints with its dot. Structural, because the symbol module cannot be
 * imported here without closing a cycle through its own base classes.
 */
export const nameOf = (frame: Frame): string | undefined => {
  if (frame instanceof FrameWord) return frame.spelling();
  const named = frame as Frame & { spelling?: () => string };
  return frame.is.address === true && typeof named.spelling === "function"
    ? named.spelling()
    : undefined;
};
