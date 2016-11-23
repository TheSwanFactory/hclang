import { Frame } from "./frame";

export class FrameChar extends Frame {
  protected data: string;

  constructor(char: string) {
    super();
    this.data = char;
  }

  public toStringData() {
    return this.data;
  }

  public toString() {
    return `\\\\${this.data.toString()}`;
  }
};
