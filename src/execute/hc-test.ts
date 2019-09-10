// import * as fs from "fs";
import { Context, Frame, FrameGroup, FrameString, NilContext } from "../frames";
import { HCEval } from "./hc-eval";

export type Counts = { [key: string]: number; };

export class HCTest extends Frame {

  public n: Counts;

  constructor(protected out: Frame) {
    super(NilContext);
    this.n = {total: 0, pass: 0, fail: 0};
  }

  public call(actual: Frame, parameter = Frame.nil): Frame {
    const source = this.get(HCEval.SOURCE);
    const expected = this.get(HCEval.EXPECT);

    if (source.is.missing || expected.is.missing) {
      return actual;
    }

    this.set(HCEval.SOURCE, Frame.missing);
    this.set(HCEval.EXPECT, Frame.missing);
    return this.out.call(actual, parameter);
  }
}
