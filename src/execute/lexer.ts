import { Any, Frame, FrameString } from "../frames.ts";
import { getSyntax } from "./syntax.ts";

export type LexOptions = { [key: string]: Any };

export class Lexer extends Frame {
  constructor(out: Frame) {
    const syntax = getSyntax();
    syntax[Lexer.kOUT] = out;
    super(syntax);
  }

  public lex_string(input: string) {
    const source = new FrameString(input);
    return this.lex(source);
  }

  public lex(source: FrameString) {
    return source.reduce(this);
  }

  public fold(argument: Frame) {
    const out = this.get(Frame.kOUT);
    this.set(Frame.kOUT, out.call(argument));
  }

  public finish(_options: LexOptions) {
    return Frame.nil;
  }
}
