import {
  type Any,
  type Context,
  Frame,
  FrameArray,
  FrameGroup,
  FrameLazy,
  FrameNote,
  FrameSchema,
  FrameSymbol,
  type IArrayConstructor,
  NilContext,
} from "../frames.ts";
import type { ICurryFunction } from "../ops.ts";

export type IAction = {
  [key: string]: Frame | IArrayConstructor;
};

export interface IPerformer extends Frame {
  perform(actions: IAction): Frame;
}

export interface IFinish extends Frame {
  finish(parameter: Frame): Frame;
}

const terminate: ICurryFunction = (pipe: Frame, parameter: Frame) => {
  if ("finish" in pipe && pipe.finish instanceof Function) {
    return pipe.finish(parameter);
  }

  const note = FrameNote.key(pipe.id, pipe);
  // console.error("terminate", pipe);
  return note;
};

export class Terminal extends Frame {
  public static end() {
    return new Terminal(terminate);
  }

  constructor(protected data: ICurryFunction) {
    super(NilContext);
    this.is.immediate = true;
  }

  public override apply(argument: Frame, parameter: Frame) {
    return this.data(argument, parameter);
  }

  protected toData(): Any {
    return this.data;
  }

  public override toString() {
    return this.id + `[${this.data}]`;
  }
}

export const terminals: Context = {};

const perform = (actions: IAction) => {
  return (source: Frame, _parameter: Frame) => {
    const performer = source as IPerformer;
    return performer.perform(actions);
  };
};

const addTerminal = (char: string, key: string) => {
  const action: IAction = {};
  action[key] = FrameSymbol.for(char);
  terminals[char] = new Terminal(perform(action));
};

function addGroup(Grouper: IArrayConstructor) {
  const sample = new Grouper([], NilContext);
  const open = sample.string_open();
  const close = sample.string_close();
  terminals[open] = new Terminal(perform({ push: Grouper }));
  terminals[close] = new Terminal(perform({ pop: Grouper }));
}

terminals[Frame.kEND] = Terminal.end();
addTerminal("\n", "end");
addTerminal(",", "next");
addTerminal(";", "semi-next");
addTerminal(" ", "bind");
addGroup(FrameArray);
addGroup(FrameGroup);
addGroup(FrameLazy);
addGroup(FrameSchema);
