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
  public static readonly ACTUAL = "# ";

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

  protected lexer: Frame;

  constructor(protected out: Frame) {
    this.lexer = HCEval.make_pipe(this.out);
  }

  public call(input: string) {
    const source = new FrameString(input);
    this.checkInput(input);
    const result = source.reduce(this.lexer);
    // console.error("HCEval.input", input);
    // console.error("HCEval.result", result.toString());
    if (result instanceof Lex) {
      const end = FrameSymbol.for("\n");
      result.call(end);
    }
    return result;
  }

  public repl(): boolean {
    console.log(".hc " + version);
    let status = true;
    while (status) {
      const input = prompt(HCEval.SOURCE);
      if (!input) {
        status = false;
        break;
      }
      const output = this.call(input);
      const debug = this.out.get("DEBUG");
      if (debug !== Frame.missing) {
        console.log(output);
      }
      if (output !== Frame.nil) {
        console.log(HCEval.EXPECT + output);
      }
    }
    return status;
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
