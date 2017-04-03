import { Context, Frame, FrameAtom, FrameComment, FrameString, FrameSymbol, Void } from "../frames";
import { Lex } from "./lex";

export class LexString extends Lex {
  public constructor() {
    super(FrameString, true);
  }

  protected isEnd(char: string) {
    return char === "”";
  }
};

export class LexComment extends Lex {
  public constructor() {
    super(FrameComment);
  }

  protected isEnd(char: string) { return char === FrameComment.COMMENT_END; }
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
