// import * as fs from "fs";
import { Frame, FrameNote, NilContext } from "../frames";
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

    if (this.actual !== Frame.missing || expected !== Frame.missing) {
      const result = this.performTest(expected, this.actual, source)
      return this.out.call(result, parameter);
    }

    if (source !== Frame.missing) {
      this.actual = argument;
    }
    return argument;
  }

  public performTest(expected: Frame, actual: Frame, source: Frame) {
    const result = this.assertEqual(expected.toString(), actual.toString(), source.toString());
    console.error("assertEqual.result", result.toString());
    this.set(HCEval.SOURCE, Frame.missing);
    this.set(HCEval.EXPECT, Frame.missing);
    this.actual = Frame.missing;
    return result;
  }

  public assertEqual(expected: string, actual: string, source: string) {
    console.error("assertEqual", "expected", expected, "actual", actual, "source", source);
    const base = source + " +" + expected;

    this.n.total += 1;
    if (expected === actual) {
      this.n.pass += 1;
      return FrameNote.pass(base);
    } else {
      this.n.pass += 1;
      return FrameNote.fail(base + " -" + actual);
    }
  }

}
