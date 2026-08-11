import { Frame, FrameNote, FrameString, NilContext } from "../frames.ts";
import { HCEval } from "./hc-eval.ts";

export type Counts = {
  total: number;
  pass: number;
  fail: number;
  skip: number;
};

type PendingTest = {
  source: string;
  actual?: string;
};

export class HCTest extends Frame {
  /** Use `# SKIP: reason` as an expected-result line to skip an example. */
  public static readonly SKIP = "SKIP";

  public n: Counts;
  private pending?: PendingTest;
  private finalSummary: Frame = Frame.missing;

  constructor(protected out: Frame) {
    super(NilContext);
    this.n = { total: 0, pass: 0, fail: 0, skip: 0 };
  }

  public override set(key: string, value: Frame): this {
    if (key === HCEval.SOURCE && !value.is.missing) {
      this.flushCase();
      super.set(key, value);
      this.pending = { source: value.toString() };
      return this;
    }

    if (key === HCEval.EXPECT && !value.is.missing) {
      const previous = this.get_here(HCEval.EXPECT);
      if (!previous.is.missing) {
        this.flushCase();
      }
      super.set(key, value);
      if (this.pending && this.isSkip(value.toString())) {
        this.complete(value.toString());
      }
      return this;
    }
    super.set(key, value);
    return this;
  }

  public override apply(argument: Frame, _parameter = Frame.nil): Frame {
    const expected = this.get_here(HCEval.EXPECT);
    if (!expected.is.missing) {
      if (this.pending || argument === Frame.nil) {
        this.complete(expected.toString());
      } else {
        // A `# ` line inside a document string is content, not an expectation.
        super.set(HCEval.EXPECT, Frame.missing);
      }
      return argument;
    }

    if (this.pending && this.pending.actual === undefined) {
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
    } else if (this.isSkip(expected)) {
      result = this.skip(this.pending.source, expected);
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

    const reason = this.pending.actual === undefined
      ? "missing actual and expectation"
      : "missing expectation";
    this.emit(this.failure(`${this.pending.source} ?<missing> !${reason}`));
    this.pending = undefined;
    this.clearMarkers();
  }

  private flushExpectation(): void {
    const expected = this.get_here(HCEval.EXPECT);
    if (expected.is.missing) return;

    this.emit(
      this.failure(`<missing source> ?${expected.toString()} !missing source`),
    );
    super.set(HCEval.EXPECT, Frame.missing);
  }

  private failure(source: string): Frame {
    this.n.total += 1;
    this.n.fail += 1;
    return FrameNote.fail(source, JSON.stringify(this.n));
  }

  private skip(source: string, expected: string): Frame {
    this.n.total += 1;
    this.n.skip += 1;
    return FrameNote.skip(`${source} ?${expected}`, JSON.stringify(this.n));
  }

  private isSkip(expected: string): boolean {
    const marker = expected.startsWith("“") && expected.endsWith("”")
      ? expected.slice(1, -1)
      : expected;
    return marker === HCTest.SKIP || marker.startsWith(`${HCTest.SKIP}:`);
  }

  private clearMarkers(): void {
    super.set(HCEval.SOURCE, Frame.missing);
    super.set(HCEval.EXPECT, Frame.missing);
  }

  private emit(result: Frame): void {
    this.out.call(result);
  }
}
