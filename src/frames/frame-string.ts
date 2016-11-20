import { Frame, FrameArray } from "./frame";
import { FrameChar } from "./frame-char";

export class FrameString extends FrameArray {
  constructor(JSstring: string) {
    let result: Array<Frame> = [];
    for (let char of JSstring) {
      result.push(new FrameChar(char));
    }
    super(result);
  }
  public toString() {
    return `“${this.data.toString()}”`;
  }
};
