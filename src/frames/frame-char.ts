import { Frame, FrameAtom } from "./frame";

export class FrameChar extends FrameAtom {
  public static readonly CHAR_BEGIN = "\\\\";

  public static for(char: string) {
    const exists = FrameChar.chars[char];
    return exists || (FrameChar.chars[char] = new FrameChar(char));
  }

  protected static chars: { [key: string]: FrameChar; } = {};

  constructor(protected data: string) {
    super();
  }

  public toData() { return this.data; }

  public string_prefix() { return FrameChar.CHAR_BEGIN; };
};
