import { Context, Frame, Void } from "./frame";
// import { FrameChar } from "./frame-char";

export class FrameString extends Frame {
  public static readonly BEGIN_STRING = "“";
  public static readonly END_STRING = "”";

  constructor(protected data: string, meta: Context = Void) {
    // let result = Array.prototype.map.call(JSstring, (char: string) => {return new FrameChar(char); });
    super(meta);
  }

  public apply(argument: FrameString) {
    this.data = this.data.concat(argument.data);
    return this;
  }

  public toStringData() {
    return this.data;
  };

  public toString() {
    return FrameString.BEGIN_STRING + this.toStringData() + FrameString.END_STRING;
  }
};
