import { Context, Frame, FrameString, FrameSymbol, Void } from "../frames";
import { ICurryFunction } from "../ops";
import { Lex } from "./lex";
import { LexPipe } from "./lex-pipe";

const finish: ICurryFunction = (source: Frame, parameter: Frame) => {
  return (source as LexPipe).finish();
};

const next: ICurryFunction = (source: Frame, parameter: Frame) => {
  return (source as LexPipe).next();
};

export class Terminal extends Frame {
  public static end() { return new Terminal(finish); };

  constructor(protected data: ICurryFunction) {
    super(Void);
    this.callme = true;
  }

  public apply(argument: Frame, parameter: Frame) {
    return this.data(argument, parameter);
  }

  protected toData(): any { return this.data; }
}

export const terminals: Context = {
};

terminals[Frame.kEND] = Terminal.end();
terminals["\n"] = new Terminal(next);
