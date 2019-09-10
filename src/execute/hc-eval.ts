// import * as fs from "fs";
import { Context, Frame, FrameGroup, FrameString } from "../frames";
import { EvalPipe } from "./eval-pipe";
import { LexPipe } from "./lex-pipe";
import { ParsePipe } from "./parse-pipe";

export interface IProcessEnv {
  [key: string]: string | undefined
}

export class HCEval {
  public static readonly SOURCE = "; ";
  public static readonly EXPECT = "# ";

  public static make_context(env: IProcessEnv): Context {
    const context: Context = {};
    Object.entries(env).forEach(([key, value]) => {
      if (key[0] !== "n") {
        context[key] = new FrameString(value);
      }
    });
    if (context["DEBUG_ENV"]) {
      console.log(context);
    }
    return context;
  }

  public static make_pipe(out: Frame): LexPipe {
    const evaluator = new EvalPipe(out); // evaluate groups into results
    const parser = new ParsePipe(evaluator, FrameGroup); // parse tokens into groups of expressions
    const lexer = new LexPipe(parser); // lex characters into tokens
    return lexer;
  }

  protected current: Frame;

  constructor(protected out: Frame) {
    this.current = HCEval.make_pipe(this.out);
  }

  public call(input: string) {
    const line = input + "\n";
    const source = new FrameString(line);
    this.current = source.reduce(this.current);
    this.setSource(input);
  }

  protected setSource(input: string) {
    const head = input.substr(0, 2);
    const tail = input.substr(2);
    if (head === HCEval.SOURCE) {
      const source = new FrameString(tail);
      this.out.set(HCEval.SOURCE, source);
    }
  }

}
