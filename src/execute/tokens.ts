import { Context, Frame, FrameAtom, FrameString, FrameSymbol, Void } from "../frames";
import { Lex } from "./lex";

export class ParseToken extends FrameAtom {
  constructor(protected data: Frame) {
    super(Void);
  }

  public called_by(callee: Frame, parameter: Frame) {
    return callee.apply(this.data, parameter);
  }
  protected toData(): any { return this.data; }
}

export class LexString extends Lex {
  protected isEnd(char: string) {
    return char === "”";
  }

  protected makeFrame() {
    const frame = new FrameString(this.body);
    return new ParseToken(frame);
  }
};

export class LexComment extends Lex {
  protected isEnd(char: string) { return char === "#" || char === "\n"; }

  protected makeFrame() {
    const frame = Frame.nil;
    return new ParseToken(frame);
  }
};

export const tokens: Context = {
 "#": new LexComment(),
 "“": new LexString(),
};
