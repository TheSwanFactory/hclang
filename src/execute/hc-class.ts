import * as fs from "fs";
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
    _.each(env, (value, key) => {
      if (key[0] !== "n") {
        context[key] = new FrameString(value);
      }
    });
    if (context["DEBUG_ENV"]) {
      console.log(context);
    }
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
    const evaluator = new EvalPipe(this); // evaluate lists into results
    const grouper = new GroupPipe(evaluator); // group expressions into lists
    const parser = new ParsePipe(grouper); // parse tokens into expressions
    this.lexer = new LexPipe(parser); // lex characters into tokens
  }

  public evaluate(input: string): Frame {
    const result = this.lexer.lex_string(input);
    if (!result) {
      return Frame.nil;
    }
    const value = result.call(this);
    return value;
  }

  public exec_file(file: string): Frame {
    const input = fs.readFileSync(file, "utf8");
    return this.evaluate(input);
  }
}
