import { Frame, FrameNote, FrameString, NilContext } from "../frames";
import { HCEval } from "./hc-eval";

export type Counts = { [key: string]: number; };

export class HCTest extends Frame {

  public n: Counts;
  protected actual: Frame;

  constructor(protected out: Frame) {
    super(NilContext);
    this.actual = Frame.missing;
    this.n = {total: 0, pass: 0, fail: 0};
  }

  public apply(argument: Frame, parameter = Frame.nil): Frame {
    const source = this.get(HCEval.SOURCE);
    const expected = this.get(HCEval.EXPECT);

    if (!this.actual.is.missing || !expected.is.missing) {
      const result = this.performTest(expected, this.actual, source)
      return this.out.call(result, parameter);
    }

    if (!source.is.missing) {
      const actual = argument.toString();
      this.actual = new FrameString(actual);
    }
    return argument;
  }

  public performTest(expected: Frame, actual: Frame, source: Frame) {
    const result = this.assertEqual(expected.toString(), actual.toString(), source.toString());
    this.set(HCEval.SOURCE, Frame.missing);
    this.set(HCEval.EXPECT, Frame.missing);
    this.actual = Frame.missing;
    return result;
  }

  public assertEqual(expected: string, actual: string, source: string) {
    const base = source + " +" + expected;

    this.n.total += 1;
    if (expected === actual) {
      this.n.pass += 1;
      return FrameNote.pass(base, JSON.stringify(this.n));
    } else {
      this.n.fail += 1;
      return FrameNote.fail(base + " -" + actual, JSON.stringify(this.n));
    }
  }
}
