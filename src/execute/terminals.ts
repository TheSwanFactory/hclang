import { Context, Frame, FrameArray, FrameGroup, FrameLazy, FrameSchema, FrameSymbol, IArrayConstructor, NilContext } from "../frames";
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
addTerminal("\n", "end");
addTerminal(",", "next");
addTerminal(";", "semi-next");
addGroup(FrameArray);
addGroup(FrameGroup);
addGroup(FrameLazy);
addGroup(FrameSchema);
