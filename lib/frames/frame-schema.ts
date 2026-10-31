// Load the FrameList cycle from FrameLazy, where it closes, so FrameList and
// FrameExpr exist before any subclass, whichever module is imported first.
import "./frame-lazy.ts";
import { Frame } from "./frame.ts";
import { FrameList } from "./frame-list.ts";
import { FrameNote } from "./frame-note.ts";
import { compileSchemaMatcher } from "./schema-compiler.ts";
import { type FrameMatcher, type MatchResult } from "./frame-match.ts";
import {
  EnumerationSchemaMatcher,
  type SchemaMatcher,
} from "./schema-matcher.ts";
import { NilContext } from "./context.ts";
import type { EvaluationInput } from "./evaluation-scope.ts";
import type { SigilStart } from "../scan.ts";

export class FrameSchema extends FrameList implements FrameMatcher {
  public static readonly BEGIN_SCHEMA = "<";
  public static readonly END_SCHEMA = ">";
  public static readonly SIGIL_STARTS = [
    { key: FrameSchema.BEGIN_SCHEMA, mode: "push" },
    { key: FrameSchema.END_SCHEMA, mode: "pop" },
  ] as const satisfies readonly SigilStart[];

  private matcher: SchemaMatcher;

  constructor(
    data: Array<Frame>,
    meta = NilContext,
    matcher: SchemaMatcher = new EnumerationSchemaMatcher(),
  ) {
    super(data, meta);
    this.matcher = matcher;
  }

  public override string_open(): string {
    return FrameSchema.BEGIN_SCHEMA;
  }

  public override string_close(): string {
    return FrameSchema.END_SCHEMA;
  }

  public override in(input: EvaluationInput = []): Frame {
    const matcher = compileSchemaMatcher(this.data);
    if (matcher) {
      return new FrameSchema([...this.data], NilContext, matcher);
    }
    const array = this.array_eval(input);
    return new FrameSchema(array);
  }

  public override apply(argument: Frame, parameter: Frame): Frame {
    const result = this.match(argument, parameter);
    return result.matched ? result.evidence : result.error;
  }

  /**
   * A schema's terms are all type terms, so repetition repeats every one, a
   * statement too: `<.x; .y;>` and `<.x, .y>` are one type and repeat alike.
   * A schema holds no properties, so only a held echo, were there one, would
   * stay once.
   */
  protected override repeatsTerm(term: Frame): boolean {
    return !this.holdsAsProperty(term);
  }

  /**
   * A repeated schema matches what the literal with its terms written n times
   * matches. With no term left that literal is `<>`, the total type. An
   * enumeration matches by its terms, so it keeps its matcher. A compiled
   * matcher was built from the terms, so it is rebuilt from the repeated ones;
   * otherwise the schema would print and match as the one it repeated.
   * `2 <.x, .y>` is `<.x, .y, .x, .y>`.
   */
  protected override finishRepetition(): Frame {
    if (this.size() === 0) return Frame.all;
    if (!(this.matcher instanceof EnumerationSchemaMatcher)) {
      this.matcher = compileSchemaMatcher(this.data) ??
        new EnumerationSchemaMatcher();
    }
    return this;
  }

  public override nativeSize(): bigint {
    // Empty enumeration means the total type, not an empty finite domain.
    // Inspect the installed matcher only; never traverse/compile candidates.
    return this.matcher instanceof EnumerationSchemaMatcher &&
        this.data.length > 0
      ? BigInt(this.data.length)
      : 1n;
  }

  public match(value: Frame, origin = Frame.nil): MatchResult {
    return this.matcher.match(this, value, origin);
  }

  public override toString(): string {
    return this.matcher.format?.() ?? super.toString();
  }

  public override dataString(): string {
    return this.matcher.format ? this.toString() : super.dataString();
  }

  public override at(index: number): Frame | FrameNote {
    if (index >= this.size() || -index > this.size()) {
      const source = "[0.." + this.size() + "]." + index;
      return FrameNote.index(source);
    }
    if (index >= 0) {
      return this.data[index];
    }
    const n = this.data.length;
    return this.data[n + index];
  }

  public length(): number {
    return this.data.length;
  }

  /** Whether matching succeeds when its evidence is discarded. */
  public matches(value: Frame): boolean {
    return this.match(value).matched;
  }
}
