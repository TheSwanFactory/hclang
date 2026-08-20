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

  public override in(contexts = [Frame.nil]): Frame {
    const matcher = compileSchemaMatcher(this.data);
    if (matcher) {
      return new FrameSchema([...this.data], NilContext, matcher);
    }
    // array_eval pushes onto the stack it is given, so it gets a copy: a schema
    // must not leave itself behind in its caller's contexts, where every later
    // lookup in that evaluation would see it. Every sibling FrameList copies.
    const array = this.array_eval([...contexts]);
    return new FrameSchema(array);
  }

  public override apply(argument: Frame, parameter: Frame): Frame {
    const result = this.match(argument, parameter);
    return result.matched ? result.evidence : result.error;
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
