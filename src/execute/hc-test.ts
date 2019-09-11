// import * as fs from "fs";
import { Frame, FrameNote, NilContext } from "../frames";
import { HCEval } from "./hc-eval";

export type Counts = { [key: string]: number; };

export class HCTest extends Frame {

  public n: Counts;

  constructor(protected out: Frame) {
    super(NilContext);
    this.n = {total: 0, pass: 0, fail: 0};
  }

  public call(argument: Frame, parameter = Frame.nil): Frame {
    const source = this.get(HCEval.SOURCE);
    const expected = this.get(HCEval.EXPECT);

    if (source.is.missing || expected.is.missing) {
      return Frame.nil;
    }
    const result = this.assertEqual(
      expected.toString(),
      argument.toString(),
      source.toString(),
    );
    this.set(HCEval.SOURCE, Frame.missing);
    this.set(HCEval.EXPECT, Frame.missing);
    return this.out.call(result, parameter);
  }

  public assertEqual(expected: string, actual: string, source: string) {
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
