import * as frame from '../frames.js'

export class FrameSpace extends frame.FrameAtom {
  public static readonly SPACE_CHAR = ' '

  constructor (meta = frame.NilContext) {
    super(meta)
    this.is.void = false
  }

  public string_start () {
    return FrameSpace.SPACE_CHAR
  };

  public canInclude (char: string) {
    return char === FrameSpace.SPACE_CHAR
  }
};
