import * as _ from "lodash";
import { Context, Frame, FrameString, FrameSymbol } from "../frames";
import { ParsePipe } from "./parse-pipe";
import { syntax } from "./syntax";

export class Lexer extends Frame {
  constructor(out: Frame) {
    syntax[Lexer.kOUT] = out;
    // console.error(` * LexPipe.meta ${JSON.stringify(meta, null, 2)}\n`);
    super(syntax);
  }

  public lex_string(input: string) {
    const source = new FrameString(input);
    return this.lex(source);
  }

  public lex(source: FrameString) {
    return source.reduce(this);
  }

  public parser(): ParsePipe {
    return this.get(Lexer.kOUT) as ParsePipe;
  }

  public finish() {
    const output = FrameSymbol.end();
    const out = this.get(Frame.kOUT);
    return out.call(output);
  }

  public next() {
    this.finish();
    return this;
  }
}
