import * as _ from "lodash";
import { FrameAtom } from "./frame-atom";
import { Context, NilContext } from "./meta-frame";

export class FrameNumber extends FrameAtom {
  public static readonly NUMBER_BEGIN = "0-9";
  public static readonly NUMBER_END = "^0-9";
  protected data: number;

  constructor(source: string, meta: Context = NilContext) {
    super(meta);
    this.data = _.toNumber(source);
  }

  public string_start() { return FrameNumber.NUMBER_BEGIN; };

  protected toData() { return this.data; }
};
