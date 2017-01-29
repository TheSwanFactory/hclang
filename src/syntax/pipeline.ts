import { Context, Frame, FrameArray, FrameLazy, FrameString, FrameSymbol, Void } from "../frames";
import { LexPipe } from "./lex";

export class EvalPipe extends Frame {
  constructor(out: Frame, meta: Context = Void) {
    meta[Frame.kOUT] = out;
    super(meta);
  }
}

export class ParsePipe extends Frame {
  constructor(out: Frame, meta: Context = Void) {
    meta[Frame.kOUT] = out;
    super(meta);
  }
}

const piper = (input: string, context = Void): Frame => {
  const source = new FrameString(input);
  const result = new FrameArray([], context); // store the result
  const evaluator = new EvalPipe(result); // evaluate expressions in context
  const parser = new ParsePipe(evaluator); // assemble tokens into expressions
  const lexer = new LexPipe(parser); // convert string into tokens

  const status = lexer.lex(source);
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
  const source = new FrameString(input);
  const output = new FrameArray([]);
  const lexer = new LexPipe(output);

  const status = lexer.lex(source);
  if (status !== lexer) {
    console.error(`\n* pipe returned ${status}`);
  }
  return out.call(output);
};
