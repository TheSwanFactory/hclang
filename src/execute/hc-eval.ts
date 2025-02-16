import chalk from "@nothing628/chalk";
import {
  type Context,
  Frame,
  FrameGroup,
  FrameNumber,
  FrameString,
  type StringMap,
} from "../frames.ts";
import { EvalPipe } from "./eval-pipe.ts";
import { Lex } from "./lex.ts";
import { LexPipe } from "./lex-pipe.ts";
import { ParsePipe } from "./parse-pipe.ts";

const { version } = JSON.parse(
  Deno.readTextFileSync(new URL("../../deno.json", import.meta.url)),
);

/**
 * The `HCEval` class provides methods for evaluating and processing input strings
 * within a specific context. It includes functionality for creating contexts from
 * entries, setting up lexical pipes, generating prompts, and running a REPL (Read-Eval-Print Loop).
*/
export class HCEval {
  public static readonly SOURCE = "; ";
  public static readonly EXPECT = "# ";

  public static isAlphabetic(char: string): boolean {
    return /\p{L}/u.test(char);
  }

  public static isNumeric(char: string): boolean {
    return /\p{N}/u.test(char);
  }

/**
 * Creates a new context from the given entries (usually environment variables).
 *
 * @param {StringMap} entries - A map of string keys to string values.
 * @returns {Context} The created context.
 *
 * @remarks
 * This method iterates over the entries and determines the type of each value
 * based on its first character:
 * - If alphabetic, the value is wrapped in a `FrameString`. 
 * - If numeric, the value is wrapped in a `FrameNumber`. 
 * - If neither, an error is logged and the key is set to `Frame.nil`.
 *
 * If the context contains a `DEBUG_ENV` key, the context is logged to the console
 * for debugging purposes.
 *
 * @example
 * ```typescript
 * const entries = {
 *   key1: "value1",
 *   key2: "12345",
 *   key3: "!@#$%"
 * };
 * const context = HCEval.make_context(entries);
 * console.log(context);
 * ```
 */
  public static make_context(entries: StringMap): Context {
    const context: Context = {};
    Object.entries(entries).forEach(([key, value]) => {
      const first = value[0];
      if (HCEval.isAlphabetic(first)) {
        context[key] = new FrameString(value);
      } else if (HCEval.isNumeric(first)) {
        context[key] = new FrameNumber(value);
      } else {
        console.error(`make_context.invalid_key: "${key}"`);
        context[key] = Frame.nil;
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

  constructor(public out: Frame) {
    this.pipe = HCEval.make_pipe(this.out);
    this.lex = this.pipe;
  }

  public call(input: string): Frame | null {
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

  protected async *getInputStream(): AsyncGenerator<string, void, unknown> {
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

  protected checkInput(input: string): void {
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
