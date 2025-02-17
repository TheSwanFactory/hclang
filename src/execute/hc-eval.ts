import chalk from "@nothing628/chalk";
import {
  type Context,
  type Frame,
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
 * const context = make_context(entries);
 * console.log(context);
 * ```
 */
export function make_context(entries: StringMap): Context {
  const context: Context = {};
  Object.entries(entries).forEach(([key, value]) => {
    if (HCEval.isInteger(value)) {
      context[key] = new FrameNumber(value);
    } else {
      context[key] = new FrameString(value);
    }
  });
  if (context.DEBUG_ENV) {
    console.debug("DEBUG_ENV", context);
  }
  return context;
}

/**
 * The `HCEval` class provides methods for evaluating and processing input strings
 * within a specific context. It includes functionality for creating contexts from
 * entries, setting up lexical pipes, generating prompts, and running a REPL (Read-Eval-Print Loop).
 */
export class HCEval {
  /**
   * SOURCE is the input prompt prefix.
   */
  public static readonly SOURCE = "; ";
  /**
   * EXPECT is the output prompt prefix.
   */
  public static readonly EXPECT = "# ";

  /**
   * Checks if the given character is alphabetic.
   *
   * @param {string} char - The character to check.
   * @returns {boolean} `true` if the character is alphabetic, `false` otherwise.
   */
  public static isAlphabetic(char: string): boolean {
    return /\p{L}/u.test(char);
  }

  /**
   * Checks if the given string is numeric.
   *
   * @param {string} value - The string to check.
   * @returns {boolean} `true` if the string is all numeric, `false` otherwise.
   */
  public static isInteger(value: string): boolean {
    return /^\p{N}+$/u.test(value);
  }

  /**
   * Creates a lexical pipe for evaluating expressions.
   */
  public static make_pipe(out: Frame): LexPipe {
    const evaluator = new EvalPipe(out); // evaluate groups into results
    const parser = new ParsePipe(evaluator, FrameGroup); // parse tokens into groups of expressions
    const lexer = new LexPipe(parser); // lex characters into tokens
    return lexer;
  }

  /**
   * Generates a prompt string for the given level.
   *
   * @param {number} level - The level of indentation.
   * @returns {string} The generated prompt string.
   */
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

  /**
   * @param input The input string to evaluate.
   * @returns
   */
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

  /**
   * Runs a Read-Eval-Print Loop (REPL) to continuously read input, evaluate it, and print the result.
   *
   * @returns {Promise<boolean>} A promise that resolves to `true` if the REPL was successful, `false` otherwise.
   */
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
