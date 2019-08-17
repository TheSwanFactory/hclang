import * as _ from "lodash";
import { Context, Frame, FrameArray, FrameString, NilContext } from "../frames";
import { EvalPipe } from "./eval-pipe";
import { GroupPipe } from "./group-pipe";
import { LexPipe } from "./lex-pipe";
import { ParsePipe } from "./parse-pipe";

export interface IProcessEnv {
    [key: string]: string | undefined
}

export class HC extends FrameArray {
  public static make_context(env: IProcessEnv = {}): Context {
    const context: Context = {};
    _.each(process.env, (value, key) => {
      context[key] = new FrameString(value);
    });
    return context;
  }

  public static from_env(env: IProcessEnv = {}): HC {
    const context = HC.make_context(env);
    const hc = new HC(context);
    return hc;
  }

  public result: FrameArray;
  public lexer: LexPipe;

  constructor(context = NilContext) {
    super([], context); // store the result
    // result['.'] = '<>'; name the object?
    const evaluator = new EvalPipe(this); // evaluate lists into results
    const grouper = new GroupPipe(evaluator); // group expressions into lists
    const parser = new ParsePipe(grouper); // parse tokens into expressions
    this.lexer = new LexPipe(parser); // lex characters into tokens
  }

  public evaluate(input: string): Frame {
    const was = this.length();
    const status = this.lexer.lex_string(input);
    if (this.length() === was) {
      return Frame.nil;
    }
    return this.at(-1);
  }
}
