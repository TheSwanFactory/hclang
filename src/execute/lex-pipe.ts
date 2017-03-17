import * as _ from "lodash";
import { Context, Frame, FrameString, FrameSymbol } from "../frames";
import { Terminal, terminals } from "./terminals";
import { tokens } from "./tokens";

const meta = _.clone(tokens);
_.merge(meta, terminals);

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
