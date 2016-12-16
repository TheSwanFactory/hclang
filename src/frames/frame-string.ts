import { Context, FrameAtom, Void } from "./frame";

export class FrameString extends FrameAtom {
  public static readonly STRING_BEGIN = "“";
  public static readonly STRING_END = "”";

  constructor(protected data: string, meta: Context = Void) {
    // let result = Array.prototype.map.call(JSstring, (char: string) => {return new FrameChar(char); });
    super(meta);
  }

  public apply(argument: FrameString) {
    this.data = this.data.concat(argument.data);
    return this;
  }

  public string_prefix() { return FrameString.STRING_BEGIN; };

  public string_suffix() { return FrameString.STRING_END; };

  protected toData() { return this.data; }
};
