import { Frame } from "./frame";

export class FrameChar extends Frame {
  public static for(char: string) {
    const exists = FrameChar.chars[char];
    return exists || (FrameChar.chars[char] = new FrameChar(char));
  }

  protected static chars: { [key: string]: FrameChar; } = {};

  constructor(protected data: string) {
    super();
  }

  public toStringData() {
    return this.data;
  }

  public toString() {
    return `\\\\${this.data.toString()}`;
  }
};
