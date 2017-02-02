import { Context, Frame, FrameString, FrameSymbol } from "../frames";
import { Lex } from "./lex";

export class LexString extends Lex {
  protected isEnd(char: string) {
    return char === "”";
  }

  protected makeFrame() {
    return new FrameString(this.body);
  }
};

export class LexComment extends Lex {
  protected isEnd(char: string) { return char === "#" || char === "\n"; }

  protected makeFrame() { return FrameSymbol.for(""); }
};

export class LexSpace extends Lex {
  protected isEnd(char: string) { return char !== " "; }

  protected makeFrame() { return FrameSymbol.for(""); }
};

export const tokens: Context = {
  " ": new LexSpace(),
  "#": new LexComment(),
  "“": new LexString(),
};
