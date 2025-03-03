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

/**
 * Creates a new context from the given key-value entries.
 *
 * @param {StringMap} entries - A map of string keys to string values
 * @returns {Context} A new context with the entries converted to appropriate Frame types
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
 */
export function make_context(entries: StringMap): Context {
  const context: Context = {};
  Object.entries(entries).forEach(([key, value]) => {
    if (Frame.isInteger(value)) {
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
   * Creates a lexical pipe for evaluating expressions.
   * @param out - The output frame where results will be stored.
   * @returns A LexPipe instance for evaluating expressions.
   */
  public static make_pipe(out: Frame): LexPipe {
    const evaluator = new EvalPipe(out); // evaluate groups into results
    const parser = new ParsePipe(evaluator, FrameGroup); // parse tokens into groups of expressions
    const lexer = new LexPipe(parser); // lex characters into tokens
    return lexer;
  }

  /**
   * The lexical pipe used for collecting input symbols into lexical tokens and
   * then passing them to the parser.
   */
  protected pipe: LexPipe;
  /**
   * The current lexical frame.  It starts as the pipe, but then becomes the token
   * until it is reset to the pipe.
   */
  protected lex: Frame;

  /**
   * Constructs an instance of HCEval.
   * @param out - The output frame where results will be stored.
   */
  constructor(public out: Frame) {
    this.pipe = HCEval.make_pipe(this.out);
    this.lex = this.pipe;
  }

  /**
   * Evaluates the given input string.
   * @param input - The input string to evaluate.
   * @returns The resulting frame or null if the input is empty.
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
   * Gets the current level of the lexical pipe.
   * @returns The current level.
   */
  public level(): number {
    return this.pipe.level;
  }

  /**
   * Checks the input string and sets the appropriate frame values based on the input prefix.
   * @param input - The input string to check.
   */
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
