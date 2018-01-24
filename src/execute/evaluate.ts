import { Context, Frame, FrameArray, FrameLazy, FrameString, FrameSymbol, NilContext } from "../frames";
import { EvalPipe } from "./eval-pipe";
import { GroupPipe } from "./group-pipe";
import { LexPipe } from "./lex-pipe";
import { ParsePipe } from "./parse-pipe";

export const evaluate = (input: string, context = NilContext): Frame => {
  const result = new FrameArray([], context); // store the result
  result.set("id", new FrameString("result"));
  const evaluator = new EvalPipe(result); // evaluate lists into results
  const grouper = new GroupPipe(evaluator); // group expressions into lists
  const parser = new ParsePipe(grouper); // parse tokens into expressions
  const lexer = new LexPipe(parser); // lex characters into tokens

  const status = lexer.lex_string(input);
  if (status !== lexer) {
    // console.error(`\n* pipe returned ${status}`);
  }
  return result;
};
