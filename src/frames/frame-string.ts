import * as _ from "lodash";
import { Context, Frame, FrameAtom, Void } from "./frame";
import { FrameSymbol } from "./frame-symbol";

export class FrameString extends FrameAtom {
  public static readonly STRING_BEGIN = "“";
  public static readonly STRING_END = "”";

  constructor(protected data: string, meta: Context = Void) {
    super(meta);
  }

  public apply(argument: FrameString) {
    return new FrameString(this.data + argument.data);
  }

  public string_prefix() { return FrameString.STRING_BEGIN; };

  public string_suffix() { return FrameString.STRING_END; };

  public reduce(iteratee: Frame) {
    return iteratee;
  }

  protected toData() { return this.data; }

};
