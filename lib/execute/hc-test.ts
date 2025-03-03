import { Frame, FrameNote, FrameString, NilContext } from "../frames.ts";
import { HCEval } from "./hc-eval.ts";

export type TestCounts = { [key: string]: number };

/**
 * The `HCTest` class extends the `Frame` class and is used to perform test operations.
 * It maintains counts of total, passed, and failed tests, and provides methods to apply tests,
 * perform tests, assert equality, and check equality.
 */
export class HCTest extends Frame {
  /** Counts of total, passed, and failed tests. */
  public n: TestCounts;

  /** The actual frame being tested. */
  protected actual: Frame;

  /**
   * Constructs an instance of the `HCTest` class.
   *
   * @param out - The output frame to be used.
   */
  constructor(protected out: Frame) {
    super(NilContext);
    this.actual = Frame.missing;
    this.n = { total: 0, pass: 0, fail: 0 };
  }

  /**
   * Applies the test operation to the given argument.
   *
   * @param argument - The frame to be tested.
   * @param parameter - An optional parameter frame.
   * @returns The result of the test operation.
   */
  public override apply(argument: Frame, parameter = Frame.nil): Frame {
    const source = this.get(HCEval.SOURCE);
    const expected = this.get(HCEval.EXPECT);

    if (!this.actual.is.missing && !expected.is.missing) {
      const result = this.performTest(expected, this.actual, source);
      this.actual = Frame.missing;
      return this.out.call(result, parameter);
    }

    if (!source.is.missing) {
      const actual = argument.toString();
      this.actual = new FrameString(actual);
    }
    return argument;
  }

  /**
   * Performs the test by comparing the expected and actual frames.
   *
   * @param expected - The expected frame.
   * @param actual - The actual frame.
   * @param source - The source frame.
   * @returns The result of the test.
   */
  public performTest(expected: Frame, actual: Frame, source: Frame): Frame {
    const result = this.assertEqual(
      expected.toString(),
      actual.toString(),
      source.toString(),
    );
    this.set(HCEval.SOURCE, Frame.missing);
    this.set(HCEval.EXPECT, Frame.missing);
    this.actual = Frame.missing;
    return result;
  }

  /**
   * Asserts that the expected and actual strings are equal.
   *
   * @param expected - The expected string.
   * @param actual - The actual string.
   * @param source - The source string.
   * @returns A frame indicating whether the test passed or failed.
   */
  public assertEqual(expected: string, actual: string, source: string): Frame {
    const base = source + " ?" + expected;
    console.log(`assertEqual: ${base}`);

    this.n.total += 1;
    if (this.checkEqual(expected, actual)) {
      this.n.pass += 1;
      return FrameNote.pass(base, JSON.stringify(this.n));
    } else {
      this.n.fail += 1;
      return FrameNote.fail(base + " !" + actual, JSON.stringify(this.n));
    }
  }

  /**
   * Checks if the expected and actual strings are equal.
   *
   * @param expected - The expected string.
   * @param actual - The actual string.
   * @returns `true` if the strings are equal, `false` otherwise.
   */
  public checkEqual(expected: string, actual: string): boolean {
    if (expected.includes("...")) {
      const parts = expected.split("...");
      console.log(`parts: ${parts}`);
      return actual.startsWith(parts[0]);
    }
    return expected === actual;
  }
}
