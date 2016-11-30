import { FrameArray } from "./frame";
import { FrameChar } from "./frame-char";

export class FrameString extends FrameArray {
  public static readonly BEGIN_STRING = "“";
  public static readonly END_STRING = "”";

  constructor(JSstring: string) {
    let result = Array.prototype.map.call(JSstring, (char: string) => {return new FrameChar(char); });
    super(result);
  }

  public apply(argument: FrameString) {
    this.data = this.data.concat(argument.data);
    return this;
  }

  public toStringData() {
    return this.data.map((obj: FrameChar) => { return obj.toStringData(); }).join("");
  };

  public toString() {
    return FrameString.BEGIN_STRING + this.toStringData() + FrameString.END_STRING;
  }
};
