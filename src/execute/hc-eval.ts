import chalk from "chalk";
import * as prompt_sync from "prompt-sync";
import * as prompt_history from "prompt-sync-history";
import { Context, Frame, FrameGroup, FrameString, FrameSymbol } from "../frames";
import { version } from "../version";
import { EvalPipe } from "./eval-pipe";
import { Lex } from "./lex";
import { LexPipe } from "./lex-pipe";
import { ParsePipe } from "./parse-pipe";

const prompt = prompt_sync({
  history: prompt_history(),
});

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
      console.log(context.toString());
    }
    return context;
  }

  public static make_pipe(out: Frame): LexPipe {
    const evaluator = new EvalPipe(out); // evaluate groups into results
    const parser = new ParsePipe(evaluator, FrameGroup); // parse tokens into groups of expressions
    const lexer = new LexPipe(parser); // lex characters into tokens
    return lexer;
  }

  public static make_prompt(level: number): string {
    const indent = 2 * (level - 1);
    const middle = " ".repeat(indent);
    return HCEval.EXPECT + middle + HCEval.EXPECT;
  }

  protected pipe: LexPipe;
  protected lex: Frame;

  constructor(protected out: Frame) {
    this.pipe = HCEval.make_pipe(this.out);
    this.lex = this.pipe;
  }

  public call(input: string) {
    if (!input) {
      return null;
    }
    // console.error("HCEval.input", input);
    const source = new FrameString(input);
    this.checkInput(input);
    const result = source.reduce(this.lex);
    // console.error("HCEval.result", result);
    this.lex = (result instanceof Lex) ? result : this.pipe;
    return result;
  }

  public repl(): boolean {
    console.log(chalk.blue(".hc " + version + ";"));
    let status = true;
    while (status) {
      const input = this.getInput();
      if (!input) {
        status = false;
        break;
      }
      this.call(input);
    }
    return status;
  }

  protected getInput() {
    let prefix = HCEval.SOURCE;
    if (this.pipe.level > 0) {
      prefix = HCEval.make_prompt(this.pipe.level);
    }
    return prompt(prefix);
  }

  protected checkInput(input: string) {
    const head = input.substr(0, 2);
    const tail = input.substr(2);
    const value = new FrameString(tail);

    switch (head) {
      case HCEval.SOURCE: {
        this.out.set(HCEval.SOURCE, value);
        break;
      }
      case HCEval.EXPECT: {
        this.out.set(HCEval.EXPECT, value);
        break;
      }
    }
  }

}
