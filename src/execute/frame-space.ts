import * as frame from "../frames";

export class FrameSpace extends frame.FrameAtom {
  public static readonly SPACE_CHAR = " ";

  public string_start() { return FrameSpace.SPACE_CHAR; };

  public canInclude(char: string) {
    return char === FrameSpace.SPACE_CHAR;
  }

  public isVoid() {
    return true;
  }
};
