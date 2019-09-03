import { Context, Frame, FrameArray, FrameExpr, FrameSymbol, IArrayConstructor, NilContext } from "../frames";
import { ICurryFunction } from "../ops";
import { LexPipe } from "./lex-pipe";

export type IAction = { [key: string]: any; };

export interface IPerformer extends Frame {
  perform(actions: IAction): Frame;
}

const terminate: ICurryFunction = (source: Frame, parameter: Frame) => {
  return (source as LexPipe).finish(parameter); // also ParsePipe
};

export class Terminal extends Frame {
  public static end() { return new Terminal(terminate); };

  constructor(protected data: ICurryFunction) {
    super(NilContext);
    this.is.immediate = true;
  }

  public apply(argument: Frame, parameter: Frame) {
    return this.data(argument, parameter);
  }

  protected toData(): any { return this.data; }
}

export const terminals: Context = {
};

const perform = (actions: IAction) => {
  return (source: Frame, parameter: Frame) => {
    return (source as IPerformer).perform(actions);
  };
};

const addTerminal = (char: string, key: string) => {
  const action: IAction = {};
  action[key] = FrameSymbol.for(char);
  terminals[char] = new Terminal(perform(action));
};

function addGroup(grouper: IArrayConstructor) {
  const sample = new grouper([], NilContext);
  const open = sample.string_open();
  const close = sample.string_close();
  terminals[open] =  new Terminal(perform({push: grouper}));
  terminals[close] =  new Terminal(perform({pop: grouper}));
}

terminals[Frame.kEND] = Terminal.end();
terminals["\n"] = new Terminal(perform({end: FrameSymbol.for("\n")}));
terminals["("] = new Terminal(perform({push: FrameExpr}));
terminals[")"] = new Terminal(perform({pop: FrameExpr}));
terminals["["] = new Terminal(perform({push: FrameArray}));
terminals["]"] = new Terminal(perform({pop: FrameArray}));
