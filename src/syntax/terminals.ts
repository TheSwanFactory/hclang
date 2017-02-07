import { Context, Frame, FrameString, FrameSymbol } from "../frames";
import { Lex } from "./lex";
import { ParseTerminal } from "./parse";

export class LexSpace extends Lex {
  protected isEnd(char: string) { return char !== " "; }

  protected makeFrame() { return FrameSymbol.for(""); }
};

export const terminals: Context = {
  " ": new LexSpace(),
};
