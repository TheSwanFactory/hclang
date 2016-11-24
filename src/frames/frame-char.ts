import { Frame } from "./frame";

export class FrameChar extends Frame {
  protected static chars: { [key: string]: FrameChar; } = {};

  public static for(char: string) {
    const exists = FrameChar.chars[char];
    return exists || (FrameChar.chars[char] = new FrameChar(char));
  }

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
