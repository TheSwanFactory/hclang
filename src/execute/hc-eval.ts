import chalk from "chalk";
import {
  type Context,
  type Frame,
  FrameGroup,
  FrameString,
} from "../frames.ts";
import { version } from "../version.ts";
import { EvalPipe } from "./eval-pipe.ts";
import { Lex } from "./lex.ts";
import { LexPipe } from "./lex-pipe.ts";
import { ParsePipe } from "./parse-pipe.ts";

export class HCEval {
  public static readonly SOURCE = "; ";
  public static readonly EXPECT = "# ";

  public static make_context(env: Deno.Env): Context {
    const context: Context = {};
    const entries = env.toObject();
    Object.entries(entries).forEach(([key, value]) => {
      if (key[0] !== "n") {
        context[key] = new FrameString(value || "undefined");
      }
    });
    if (context.DEBUG_ENV) {
      console.debug("DEBUG_ENV", context);
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
    const source = new FrameString(input);
    this.checkInput(input);
    const result = source.reduce(this.lex);
    this.lex = (result instanceof Lex) ? result : this.pipe;
    return result;
  }

  public async repl(): Promise<boolean> {
    console.log(chalk.green(".hc " + version + ";"));
    let status = true;
    for await (const input of this.getInputStream()) {
      if (!input) {
        status = false;
        break;
      }
      this.call(input);
    }
    return status;
  }

  protected async *getInputStream() {
    const decoder = new TextDecoderStream();
    const stdinStream = Deno.stdin.readable.pipeThrough(decoder);
    const reader = stdinStream.getReader();

    while (true) {
      let prefix = HCEval.SOURCE;
      if (this.pipe.level > 0) {
        prefix = HCEval.make_prompt(this.pipe.level);
      }

      await Deno.stdout.write(new TextEncoder().encode(chalk.grey(prefix)));

      const { value, done } = await reader.read();
      if (done) break;
      yield value.trim();
    }
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
