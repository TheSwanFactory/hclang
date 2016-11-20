import { Frame, FrameArray } from "./frame";
import { FrameChar } from "./frame-char";

export class FrameString extends FrameArray {
  public static readonly BEGIN = "“";
  public static readonly END = "”";

  constructor(JSstring: string) {
    let result: Array<Frame> = [];
    for (let char of JSstring) {
      result.push(new FrameChar(char));
    }
    super(result);
  }

  public toStringData() {
    return this.data.map((obj: FrameChar) => { return obj.toChar(); }).join("");
  };

  public toString() {
    return FrameString.BEGIN + this.toStringData() + FrameString.BEGIN;
  }
};
