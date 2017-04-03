import { Context, Frame, FrameAtom, FrameComment, FrameString, FrameSymbol, Void } from "../frames";
import { Lex } from "./lex";

export class LexString extends Lex {
  public constructor() {
    super(FrameString, {isQuote: true});
  }
};

export class LexComment extends Lex {
  public constructor() {
    super(FrameComment);
  }
};

export class LexSpace extends Lex {
  public constructor() {
    super(Frame.nil);
  }

  protected isEnd(char: string) {
    this.pass_on = true;
    return char !== " ";
  }
};

export const tokens: Context = {
 " ": new LexSpace(),
 "#": new LexComment(),
 "“": new LexString(),
};
