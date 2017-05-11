import * as _ from "lodash";
import { Context, Frame, FrameString, FrameSymbol } from "../frames";
import { ParsePipe } from "./parse-pipe";
import { syntax } from "./syntax";

export class LexPipe extends Frame {
  constructor(out: Frame) {
    syntax[LexPipe.kOUT] = out;
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

  public finish() {
    const output = FrameSymbol.end();
    const out = this.get(Frame.kOUT);
    return out.call(output);
  }

  public parser(): ParsePipe {
    return this.get(LexPipe.kOUT) as ParsePipe;
  }

  public perform(actions: Context) {
    this.finish();
    return this;
  }

  public next(parameter: Frame) {
    this.finish();
    return this;
  }

  public push(parameter: Frame): Frame {
    const next_parser = this.parser().push();
    this.set(LexPipe.kOUT, next_parser);
    return this;
  }

  public pop(parameter: Frame): Frame {
    const next_parser = this.parser().pop();
    this.set(LexPipe.kOUT, next_parser);
    return this;
  }
}
