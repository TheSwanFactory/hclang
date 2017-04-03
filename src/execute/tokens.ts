import { Context, Frame, FrameAtom, FrameComment, FrameString, FrameSymbol, Void } from "../frames";
import { Lex } from "./lex";

export class LexQuote extends Lex {
  protected constructor(factory: any) {
    super(factory);
  }
  protected isQuoting() {
    return true;
  }
};

export class LexString extends LexQuote {
  public constructor() {
    super(FrameString);
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
