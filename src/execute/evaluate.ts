import { Context, Frame, FrameArray, FrameLazy, FrameString, FrameSymbol, Void } from "../frames";
import { EvalPipe } from "./eval-pipe";
import { LexPipe } from "./lex-pipe";
import { ParsePipe } from "./parse-pipe";

export const evaluate = (input: string, context = Void): Frame => {
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
