import { Context, Frame, FrameArray, FrameLazy, FrameString, FrameSymbol, Void } from "../frames";
import { tokens } from "./tokens";

export class LexParse extends Frame {
  constructor(out: Frame) {
    tokens[Frame.kOUT] = out;
    super(tokens);
  }

  public lex_string(input: string) {
    const source = new FrameString(input);
    return this.lex(source);
  }

  public lex(source: FrameString) {
    return source.reduce(this);
  }
}

export const framify = (input: string, context = Void): Frame => {
  const env = new Frame(context);
  const codify = new FrameLazy([]);
  const expr = pipe(input, codify);
  return expr.call(env);
};

const pipe = (input: string, out: Frame): Frame => {
  const output = new FrameArray([]);
  const lexer = new LexParse(output);

  const status = lexer.lex_string(input);
  if (status !== lexer) {
    // console.error(`\n* pipe returned ${status}`);
  }
  return out.call(output);
};
