import { Context, Frame, FrameArray, FrameLazy, FrameString, FrameSymbol, Void } from "../frames";
<<<<<<< HEAD
import { tokens } from "./tokens";

export class LexParse extends Frame {
  constructor(out: Frame) {
    tokens[Frame.kOUT] = out;
    super(tokens);
  }

  public lex_string(input: string) {
    const source = new FrameString(input);
    return this.lex(source);
=======
import { LexPipe } from "./lex";
import { ParsePipe } from "./parse";

export class EvalPipe extends Frame {
  constructor(out: Frame, meta: Context = Void) {
    super(meta);
    this.set(Frame.kOUT, out);
>>>>>>> master
  }

<<<<<<< HEAD
  public lex(source: FrameString) {
    return source.reduce(this);
=======
  const status = lexer.lex_string(input);
  if (status !== lexer) {
    // console.error(`\n* pipe returned ${status}`);
>>>>>>> master
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
