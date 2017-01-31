import { Context, Frame, FrameArray, FrameLazy, FrameString, FrameSymbol, Void } from "../frames";
import { LexPipe } from "./lex";
import { ParsePipe } from "./parse";

export class EvalPipe extends Frame {
  constructor(out: Frame, meta: Context = Void) {
    super(meta);
    this.set(Frame.kOUT, out);
  }
}

const piper = (input: string, context = Void): Frame => {
  const result = new FrameArray([], context); // store the result
  const evaluator = new EvalPipe(result); // evaluate expressions in context
  const parser = new ParsePipe(evaluator); // assemble tokens into expressions
  const lexer = new LexPipe(parser); // convert string into tokens

  const status = lexer.lex_string(input);
  if (status !== lexer) {
    console.error(`\n* pipe returned ${status}`);
  }
  return result;
};

export const framify = (input: string, context = Void): Frame => {
  const env = new Frame(context);
  const codify = new FrameLazy([]);
  const expr = pipe(input, codify);
  return expr.call(env);
};

export const framify_new = (input: string, context = Void): Frame => {
  const result = new FrameArray([], context);
  const parser = new ParsePipe(result);
  const status = pipe(input, parser);
  console.error(`\n* framify_new.pipe returned ${status}`);
  const expr = result.at(0);
  return expr.call(result);
};

const pipe = (input: string, out: Frame): Frame => {
  const output = new FrameArray([]);
  const lexer = new LexPipe(output);

  const status = lexer.lex_string(input);
  if (status !== lexer) {
    console.error(`\n* pipe returned ${status}`);
  }
  return out.call(output);
};
