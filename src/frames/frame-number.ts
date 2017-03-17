import { Context, Frame, FrameAtom, Void } from "./frame";

export class FrameNumber extends FrameAtom {
  public static readonly NUMBER_BEGIN = "0-9";
  public static readonly NUMBER_END = "^0-9";

  constructor(protected data: string, meta: Context = Void) {
    super(meta);
  }

  public string_prefix() { return FrameNumber.NUMBER_BEGIN; };

  public string_suffix() { return FrameNumber.NUMBER_END; };

  protected toData() { return this.data; }
};
