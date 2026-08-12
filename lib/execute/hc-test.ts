import { Frame, FrameNote, FrameString, NilContext } from "../frames.ts";
import { HCEval } from "./hc-eval.ts";

export type Counts = {
  total: number;
  pass: number;
  fail: number;
  unimplemented: number;
};

type PendingTest = {
  source: string;
  actual?: string;
  statement: boolean;
};

export class HCTest extends Frame {
  /** Marks an evaluated example whose correct result is not implemented yet. */
  public static readonly UNIMPLEMENTED = "$!.unimplemented";

  public n: Counts;
  private pending?: PendingTest;
  private finalSummary: Frame = Frame.missing;

  constructor(protected out: Frame) {
    super(NilContext);
    this.n = { total: 0, pass: 0, fail: 0, unimplemented: 0 };
  }

  public override set(key: string, value: Frame): this {
    if (key === HCEval.SOURCE && !value.is.missing) {
      this.flushCase();
      if (!this.hasContent(value.toString())) {
        this.emit(this.failure(`${value.toString()} !missing source`));
        super.set(key, Frame.missing);
        return this;
      }
      const source = value.toString();
      super.set(key, value);
      this.pending = {
        source,
        statement: this.isStatementSource(source),
      };
      return this;
    }

    if (key === HCEval.EXPECT && !value.is.missing) {
      const previous = this.get_here(HCEval.EXPECT);
      if (!previous.is.missing) {
        this.flushCase();
      }
      super.set(key, value);
      return this;
    }
    super.set(key, value);
    return this;
  }

  public override apply(argument: Frame, _parameter = Frame.nil): Frame {
    const expected = this.get_here(HCEval.EXPECT);
    if (!expected.is.missing) {
      if (this.pending) {
        this.complete(expected.toString());
      } else {
        // Without a pending source, `# ` is an ordinary HC comment.
        super.set(HCEval.EXPECT, Frame.missing);
      }
      return argument;
    }

    if (this.pending && this.pending.actual === undefined) {
      if (this.pending.statement || argument.is.statement) {
        this.pending = undefined;
        this.clearMarkers();
        return argument;
      }
      this.pending.actual = new FrameString(argument.toString()).toString();
      super.set(HCEval.SOURCE, Frame.missing);
    }
    return argument;
  }

  public performTest(expected: Frame, actual: Frame, source: Frame): Frame {
    const result = this.assertEqual(
      expected.toString(),
      actual.toString(),
      source.toString(),
    );
    this.pending = undefined;
    this.clearMarkers();
    return result;
  }

  public assertEqual(expected: string, actual: string, source: string): Frame {
    const base = source + " ?" + expected;
    this.n.total += 1;
    if (this.checkEqual(expected, actual)) {
      this.n.pass += 1;
      return FrameNote.pass(base, JSON.stringify(this.n));
    }

    this.n.fail += 1;
    return FrameNote.fail(base + " !" + actual, JSON.stringify(this.n));
  }

  public checkEqual(expected: string, actual: string): boolean {
    if (expected.includes("...")) {
      return actual.startsWith(expected.split("...")[0]);
    }
    return expected === actual;
  }

  /** Flushes incomplete input and emits the authoritative final summary. */
  public finish(): Frame {
    if (this.finalSummary.is.missing) {
      this.flushCase();
      this.finalSummary = FrameNote.summary("HCTest", JSON.stringify(this.n));
      this.emit(this.finalSummary);
    }
    return this.finalSummary;
  }

  public get exitCode(): number {
    return this.n.fail > 0 ? 1 : 0;
  }

  private complete(expected: string): void {
    let result: Frame;
    if (!this.pending) {
      result = this.failure(`<missing source> ?${expected} !missing source`);
    } else {
      const correct = this.unimplementedExpected(expected);
      if (correct === "") {
        result = this.failure(
          `${this.pending.source} ?${expected} !missing correct value`,
        );
      } else if (correct !== null) {
        result = this.pending.actual !== undefined &&
            this.checkEqual(correct, this.pending.actual)
          ? this.failure(
            `${this.pending.source} ?${expected} !unexpectedly implemented; remove marker`,
          )
          : this.unimplemented(
            this.pending.source,
            expected,
            this.pending.actual ?? "<missing>",
          );
      } else if (this.pending.actual === undefined) {
        result = this.failure(
          `${this.pending.source} ?${expected} !missing actual`,
        );
      } else {
        result = this.assertEqual(
          expected,
          this.pending.actual,
          this.pending.source,
        );
      }
    }

    this.pending = undefined;
    this.clearMarkers();
    this.emit(result);
  }

  private flushCase(): void {
    const expected = this.get_here(HCEval.EXPECT);
    if (this.pending && !expected.is.missing) {
      this.complete(expected.toString());
      return;
    }
    this.flushPending();
    this.flushExpectation();
  }

  private flushPending(): void {
    if (!this.pending) return;

    if (this.pending.statement) {
      this.pending = undefined;
      this.clearMarkers();
      return;
    }

    const reason = this.pending.actual === undefined
      ? "missing actual and expectation"
      : "missing expectation";
    this.emit(this.failure(`${this.pending.source} ?<missing> !${reason}`));
    this.pending = undefined;
    this.clearMarkers();
  }

  private flushExpectation(): void {
    // Without a pending source, `# ` is an ordinary HC comment.
    super.set(HCEval.EXPECT, Frame.missing);
  }

  private failure(source: string): Frame {
    this.n.total += 1;
    this.n.fail += 1;
    return FrameNote.fail(source, JSON.stringify(this.n));
  }

  private unimplemented(
    source: string,
    expected: string,
    actual: string,
  ): Frame {
    this.n.total += 1;
    this.n.unimplemented += 1;
    return FrameNote.unimplemented(
      `${source} ?${expected} !${actual}`,
      JSON.stringify(this.n),
    );
  }

  private unimplementedExpected(expected: string): string | null {
    const quoted = expected.startsWith("“") && expected.endsWith("”");
    const marker = quoted ? expected.slice(1, -1) : expected;
    if (marker === HCTest.UNIMPLEMENTED) return "";

    const prefix = `${HCTest.UNIMPLEMENTED} `;
    if (!marker.startsWith(prefix)) return null;

    const correct = marker.slice(prefix.length);
    if (!this.hasContent(correct)) return "";
    return quoted ? `“${correct}”` : correct;
  }

  private hasContent(value: string): boolean {
    const unquoted = value.startsWith("“") && value.endsWith("”")
      ? value.slice(1, -1)
      : value;
    return unquoted.trim().length > 0;
  }

  private isStatementSource(source: string): boolean {
    const unquoted = source.startsWith("“") && source.endsWith("”")
      ? source.slice(1, -1)
      : source;
    return unquoted.trimEnd().endsWith(";");
  }

  private clearMarkers(): void {
    super.set(HCEval.SOURCE, Frame.missing);
    super.set(HCEval.EXPECT, Frame.missing);
  }

  private emit(result: Frame): void {
    this.out.call(result);
  }
}
