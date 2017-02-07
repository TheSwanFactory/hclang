import * as _ from "lodash";
import { Context, Frame, FrameArray, FrameLazy, FrameString, FrameSymbol, Void } from "../frames";
import { terminals } from "./terminals";
import { tokens } from "./tokens";

const meta = _.clone(tokens);
_.merge(meta, terminals);

export class LexPipe extends Frame {
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
}
