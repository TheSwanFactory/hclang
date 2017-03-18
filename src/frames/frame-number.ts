import * as _ from "lodash";
import { Context, Frame, FrameAtom, Void } from "./frame";

export class FrameNumber extends FrameAtom {
  public static readonly NUMBER_BEGIN = "0-9";
  public static readonly NUMBER_END = "^0-9";
  protected data: number;

  constructor(source: string, meta: Context = Void) {
    super(meta);
    this.data = _.toNumber(source);
  }

  protected toData() { return this.data; }
};
