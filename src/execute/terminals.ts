import { Context, Frame, FrameString, FrameSymbol, Void } from "../frames";
import { ICurryFunction } from "../ops";
import { Lex } from "./lex";
import { LexPipe } from "./lex-pipe";

export type MethodDict = { [key: string]: any };

export const ender: ICurryFunction = (source: Frame, parameter: Frame) => {
  const pipe = source as LexPipe;
  return pipe.finish();
};

export const next: ICurryFunction = (source: Frame, parameter: Frame) => {
  const pipe = source as LexPipe;
  return pipe.next();
};

const call_lex = (method_name: string): ICurryFunction  => {
  return (source: Frame, parameter: Frame) => {
    const pipe = source as MethodDict;
    const method = pipe[method_name] as any;
    return method();
  };
};

export class Terminal extends Frame {
  public static end() { return new Terminal(ender); };

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
