import { Context, Frame, FrameString, FrameSymbol, Void } from "../frames";
import { ICurryFunction } from "../ops";
import { Lex } from "./lex";

export class LexTerminal extends Frame {
  constructor(protected data: ICurryFunction) {
    super(Void);
    this.callme = true;
  }

  public apply(argument: Frame, parameter: Frame) {
    return this.data(argument, parameter);
  }

  protected toData(): any { return this.data; }
}

export class LexSpace extends Lex {
  protected isEnd(char: string) { return char !== " "; }

  protected makeFrame() { return FrameSymbol.for(""); }
};

export const terminals: Context = {
//  " ": new LexSpace(),
};
