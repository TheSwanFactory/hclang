import { Context, Frame, FrameString, FrameSymbol, NilContext } from "../frames";
import { ICurryFunction } from "../ops";
import { Lex } from "./lex";
import { LexPipe } from "./lex-pipe";

export class Terminal extends Frame {
  public static end() { return new Terminal(finish); };

  constructor(protected data: ICurryFunction) {
    super(NilContext);
    this.callme = true;
  }

  public apply(argument: Frame, parameter: Frame) {
    return this.data(argument, parameter);
  }

  protected toData(): any { return this.data; }
}

export const terminals: Context = {
};

const finish: ICurryFunction = (source: Frame, parameter: Frame) => {
  return (source as LexPipe).finish();
};

const next: ICurryFunction = (source: Frame, parameter: Frame) => {
  return (source as LexPipe).next();
};

const push: ICurryFunction = (source: Frame, parameter: Frame) => {
  return (source as LexPipe).push();
};

const pop: ICurryFunction = (source: Frame, parameter: Frame) => {
  return (source as LexPipe).pop();
};

terminals[Frame.kEND] = Terminal.end();
terminals["\n"] = new Terminal(next);
terminals["("] = new Terminal(push);
terminals[")"] = new Terminal(pop);
