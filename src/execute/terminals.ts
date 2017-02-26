import { Context, Frame, FrameString, FrameSymbol, Void } from "../frames";
import { ICurryFunction } from "../ops";
import { Lex } from "./lex";
import { LexPipe } from "./lex-pipe";

export const ender: ICurryFunction = (source: Frame, parameter: Frame) => {
  const pipe = source as LexPipe;
  return pipe.finish();
};

export class LexTerminal extends Frame {
  public static end() { return new LexTerminal(ender); };

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
  " ": new LexSpace(),
};
