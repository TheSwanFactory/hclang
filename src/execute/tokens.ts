import { Context, Frame, FrameAtom, FrameComment, FrameString, FrameSymbol, Void } from "../frames";
import { Lex } from "./lex";

export class Token extends FrameAtom {
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
    return new Token(frame);
  }
};

export class LexComment extends Lex {
  protected isEnd(char: string) { return char === "#" || char === "\n"; }

  protected makeFrame() {
    const frame = new FrameComment(this.body);
    return new Token(frame);
  }
};

export class LexSpace extends Lex {
  protected isEnd(char: string) {
    this.pass_on = true;
    return char !== " ";
  }

  protected makeFrame() { return Frame.nil; }
};

export const tokens: Context = {
 " ": new LexSpace(),
 "#": new LexComment(),
 "“": new LexString(),
};
