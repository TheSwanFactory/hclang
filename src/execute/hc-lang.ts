import * as fs from "fs";
import * as _ from "lodash";
import { Context, Frame, FrameArray, FrameGroup, FrameString, NilContext } from "../frames";
import { EvalPipe } from "./eval-pipe";
import { LexPipe } from "./lex-pipe";
import { ParsePipe } from "./parse-pipe";

export interface IProcessEnv {
    [key: string]: string | undefined
}

const make_context = (env: IProcessEnv) => {
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
};

export class HCLang extends FrameArray {

  public static make_pipe(dest: FrameArray): LexPipe {
    const evaluator = new EvalPipe(dest); // evaluate groups into results
    const parser = new ParsePipe(evaluator, FrameGroup); // parse tokens into groups of expressions
    const lexer = new LexPipe(parser); // lex characters into tokens
    return lexer;
  }

  public result: FrameArray;
  public lexer: LexPipe;

  constructor(env: IProcessEnv = {}) {
    super([], NilContext);
    const context = make_context(env);
    const root = new Frame(context);
    this.up = root;
    this.lexer = HCLang.make_pipe(this); // lex characters into tokens
  }

  public evaluate(input: string): Frame {
    const result = this.lexer.lex_string(input);
    if (!result || result.is.statement) {
      return Frame.nil;
    }
    return result;
  }

  public exec_file(file: string): Frame {
    const input = fs.readFileSync(file, "utf8");
    return this.evaluate(input);
  }
}
