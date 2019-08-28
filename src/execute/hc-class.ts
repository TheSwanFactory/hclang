import * as fs from "fs";
import * as _ from "lodash";
import { Context, Frame, FrameArray, FrameExpr, FrameString, NilContext } from "../frames";
import { EvalPipe } from "./eval-pipe";
import { GroupPipe } from "./group-pipe";
import { LexPipe } from "./lex-pipe";
import { ParsePipe } from "./parse-pipe";

export interface IProcessEnv {
    [key: string]: string | undefined
}

export class HC extends FrameArray {
  public static make_context(env: IProcessEnv): Context {
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

  public static make_pipe(dest: FrameArray): LexPipe {
    const evaluator = new EvalPipe(dest); // evaluate lists into results
    const parser = new ParsePipe(evaluator, FrameExpr); // parse tokens into expressions
    const lexer = new LexPipe(parser); // lex characters into tokens
    return lexer;
  }

  public result: FrameArray;
  public lexer: LexPipe;

  constructor(env: IProcessEnv = {}) {
    super([], NilContext);
    const context = HC.make_context(env);
    const root = new Frame(context);
    this.up = root;
    this.lexer = HC.make_pipe(this); // lex characters into tokens
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
