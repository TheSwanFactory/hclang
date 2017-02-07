import { Context, Frame, FrameArray, FrameLazy, FrameString, FrameSymbol, Void } from "../frames";
import { LexPipe } from "./lex-pipe";

export class EvalPipe extends Frame {
  constructor(out: Frame, meta: Context = Void) {
    meta[EvalPipe.kOUT] = out;
    super(meta);
  }
}

export class ParsePipe extends Frame {
  constructor(out: Frame, meta: Context = Void) {
    meta[ParsePipe.kOUT] = out;
    super(meta);
  }
}

const piper = (input: string, context = Void): Frame => {
  const result = new FrameArray([], context); // store the result
  const evaluator = new EvalPipe(result); // evaluate expressions in context
  const parser = new ParsePipe(evaluator); // assemble tokens into expressions
  const lexer = new LexPipe(parser); // convert string into tokens

  const status = lexer.lex_string(input);
  if (status !== lexer) {
    // console.error(`\n* pipe returned ${status}`);
  }
  return result;
};
