import * as _ from "lodash";
import { Context, Frame, FrameArray, FrameString, NilContext } from "../frames";
import { EvalPipe } from "./eval-pipe";
import { GroupPipe } from "./group-pipe";
import { LexPipe } from "./lex-pipe";
import { ParsePipe } from "./parse-pipe";

interface IProcessEnv {
    [key: string]: string | undefined
}

class HC  {
  public result: FrameArray;
  public lexer: LexPipe;

  constructor(env: IProcessEnv = {}) {
    const context: Context = {};
    _.each(process.env, (value, key) => {
      context[key] = new FrameString(value);
    });

    this.result = new FrameArray([], context); // store the result
    const evaluator = new EvalPipe(this.result); // evaluate lists into results
    const grouper = new GroupPipe(evaluator); // group expressions into lists
    const parser = new ParsePipe(grouper); // parse tokens into expressions
    this.lexer = new LexPipe(parser); // lex characters into tokens
  }

  public evaluate(input: string): Frame {
    const status = this.lexer.lex_string(input);
    return this.result;
  }
}
