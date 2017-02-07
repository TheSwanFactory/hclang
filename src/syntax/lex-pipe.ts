import * as _ from "lodash";
import { Context, Frame, FrameArray, FrameLazy, FrameString, FrameSymbol, Void } from "../frames";
import { ICurryFunction } from "../ops";
import { Lex } from "./lex";
import { ParseTerminal } from "./parse";
import { terminals } from "./terminals";
import { tokens } from "./tokens";

export const ender: ICurryFunction = (source: Frame, parameter: Frame) => {
  const pipe = source as LexPipe;
  return pipe;
};

const meta = _.clone(tokens);
_.merge(meta, terminals);
meta[Frame.kEND] = new ParseTerminal(ender);

export class LexPipe extends Lex {
  constructor(out: Frame) {
    meta[Frame.kOUT] = out;
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
