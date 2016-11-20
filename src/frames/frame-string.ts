import { FrameArray } from "./frame";

export class FrameString extends FrameArray {
  constructor(JSstring: string) {
    super();
  }
  public toString() {
    return `“${this.data.toString()}”`;
  }
};
