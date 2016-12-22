import { Context, FrameAtom, Void } from "./frame";

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

  protected toData() { return this.data; }
};
