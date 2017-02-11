import * as _ from "lodash";
import { Context, Frame, FrameArray, FrameLazy, FrameString, FrameSymbol, Void } from "../frames";
import { ICurryFunction } from "../ops";
import { LexTerminal, terminals } from "./terminals";
import { tokens } from "./tokens";

export const ender: ICurryFunction = (source: Frame, parameter: Frame) => {
  const pipe = source as LexPipe;
  return pipe.finish();
};

const meta = _.clone(tokens);
_.merge(meta, terminals);
meta[Frame.kEND] = new LexTerminal(ender);

export class LexPipe extends Frame {
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
    const output = FrameSymbol.end();
    const out = this.get(Frame.kOUT);
    return out.call(output);
  }
}
