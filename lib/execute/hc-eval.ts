import {
  type Context,
  Frame,
  FrameGroup,
  FrameNumber,
  FrameString,
  FrameSymbol,
  type StringMap,
} from "../frames.ts";
import { EvalPipe } from "./eval-pipe.ts";
import { LexPipe } from "./lex-pipe.ts";
import { ParsePipe } from "./parse-pipe.ts";
import { sigilizer } from "./sigilizer.ts";

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
   */
  public static make_pipe(out: Frame): LexPipe {
    const evaluator = new EvalPipe(out); // evaluate groups into results
    const parser = new ParsePipe(evaluator, FrameGroup); // parse tokens into groups of expressions
    const lexer = new LexPipe(parser); // symbolicate, sigilize, and lex into tokens
    return lexer;
  }

  protected pipe: LexPipe;
  protected lex: Frame;
  private lexicalError: string | null = null;
  private inputBuffer = "";
  private needsFinish = false;

  constructor(public out: Frame) {
    this.pipe = HCEval.make_pipe(this.out);
    this.lex = this.pipe;
  }

  /**
   * @param input The input string to evaluate.
   * @param endOfLine Whether this transport chunk ends a logical source line.
   * Embedded newlines always end logical lines; incomplete transport fragments
   * are buffered so prompt detection and lexing see the same line boundaries.
   * @returns
   */
  public call(input: string, endOfLine = true): Frame | null {
    if (!input && !endOfLine) {
      return null;
    }

    this.inputBuffer += input;
    let result: Frame | null = null;
    let newline = this.inputBuffer.indexOf("\n");

    while (newline >= 0) {
      const line = this.inputBuffer.slice(0, newline);
      this.inputBuffer = this.inputBuffer.slice(newline + 1);
      result = this.reduceLine(line, true);
      newline = this.inputBuffer.indexOf("\n");
    }

    // A pending lexeme owns the line structure of its own body, so an empty
    // logical line still has to reach it.
    const hasLogicalLine = this.inputBuffer.length > 0 || input.length > 0 ||
      this.lex !== this.pipe;
    if (endOfLine && hasLogicalLine) {
      result = this.reduceLine(this.inputBuffer, true);
      this.inputBuffer = "";
    }

    return result;
  }

  private reduceLine(input: string, endOfLine: boolean): Frame {
    const activeDocument = this.lex.is.document === true;
    if (this.lex === this.pipe) {
      this.lexicalError = null;
    }
    const source = new FrameString(input);
    if (!activeDocument) {
      this.checkInput(input);
    }
    const result = source.reduce(this.lex, endOfLine);
    this.lex = result.is.lexical === true ? result : this.pipe;
    if (result.is.error === true) {
      this.lexicalError = result.toString();
    }
    this.needsFinish = endOfLine ? false : this.needsFinish || input.length > 0;
    return result;
  }

  public finish(): boolean {
    let complete = true;

    if (this.inputBuffer.length > 0) {
      this.reduceLine(this.inputBuffer, false);
      this.inputBuffer = "";
    }

    if (this.lex !== this.pipe) {
      const result = sigilizer.finish(this.lex, FrameSymbol.end());
      complete = result.is.error !== true;
      this.lexicalError = complete ? null : result.toString();
    } else if (this.needsFinish) {
      this.pipe.finish(Frame.nil);
      this.lexicalError = null;
    } else {
      this.lexicalError = null;
    }

    if (!complete) {
      this.pipe = HCEval.make_pipe(this.out);
    }
    this.lex = this.pipe;
    this.inputBuffer = "";
    this.needsFinish = false;
    return complete;
  }

  public error(): string | null {
    return this.lexicalError;
  }

  public level(): number {
    return this.pipe.level;
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
