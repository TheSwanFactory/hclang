import { Context, Frame, FrameString, FrameSymbol } from "../frames";
import { Lex } from "./lex";
import { ParseToken } from "./parse";

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
    const frame = FrameSymbol.for("");
    return new ParseToken(frame);
  }
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
