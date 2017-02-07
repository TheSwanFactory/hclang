import * as _ from "lodash";
import { Context, Frame, FrameArray, FrameLazy, FrameString, FrameSymbol, Void } from "../frames";
import { ICurryFunction } from "../ops";
import { Lex } from "./lex";
import { ParseTerminal } from "./parse";
import { terminals } from "./terminals";
import { tokens } from "./tokens";

export const ender: ICurryFunction = (source: Frame, parameter: Frame) => {
  const pipe = source as LexPipe;
  return pipe.finish();
};

export class LexTerminal extends Frame {
  constructor(protected data: ICurryFunction) {
    super(Void);
  }

  public call(argument: Frame, parameter: Frame) {
    return this.data.call(argument, parameter);
  }

  protected toData(): any { return this.data; }
}

const meta = _.clone(tokens);
_.merge(meta, terminals);
meta[Frame.kEND] = new LexTerminal(ender);

export class LexPipe extends Lex {
  constructor(out: Frame) {
    meta[Frame.kOUT] = out;
    // console.error(` * LexPipe.meta ${JSON.stringify(meta, null, 2)}\n`);
    super(meta);
  }

  public lex_string(input: string) {
    const source = new FrameString(input);
    return this.lex(source);
  }

  public lex(source: FrameString) {
    return source.reduce(this);
  }

  public finish() {
    return this.exportFrame();
  }

  protected makeFrame() {
    return FrameSymbol.end();
  }
}
