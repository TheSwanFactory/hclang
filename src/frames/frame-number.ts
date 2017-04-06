import * as _ from "lodash";
import { Context, Frame, NilContext } from "./frame";
import { FrameAtom } from "./frame-atom";

export class FrameNumber extends FrameAtom {
  public static readonly NUMBER_BEGIN = "0-9";
  public static readonly NUMBER_END = "^0-9";
  protected data: number;

  constructor(source: string, meta: Context = NilContext) {
    super(source, meta);
    this.data = _.toNumber(source);
  }

  protected toData() { return this.data; }
};
