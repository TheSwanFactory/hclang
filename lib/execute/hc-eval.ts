import {
  type Context,
  Frame,
  FrameCount,
  FrameString,
  FrameSymbol,
  type StringMap,
} from "../frames.ts";
// Installs the Denum class that `.###` constructs and `.####` reads (011.20).
import "./denum-prologue.ts";
// Installs the RotorRouter class that list division answers (007.27c).
import "./router-prologue.ts";
import { EvalPipe, makeSourcePipe } from "./eval-pipe.ts";
import { LexPipe } from "./lex-pipe.ts";
import { evaluateResourceSource } from "./resource-import.ts";
import { sigilizer } from "../sigilizer.ts";
import { EXPECT_PREFIX, SOURCE_PREFIX } from "./testdoc-markers.ts";

/**
 * Creates a new context from the given key-value entries.
 *
 * @param {StringMap} entries - A map of string keys to string values
 * @returns {Context} A new context with the entries converted to appropriate Frame types
 *
 * @remarks
 * Each value becomes a Frame by its whole text:
 * - An all-digit value becomes a `FrameCount`, as the same digits written in
 *   source would be.
 * - Any other value becomes a `FrameString`.
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
    if (/^\p{Nd}+$/u.test(value)) {
      context[key] = FrameCount.for(value);
    } else {
      context[key] = new FrameString(value);
    }
  });
  return context;
}

/**
 * Builds the evaluator and the lexer that feeds it for one source unit, with
 * imports evaluated and structure checked strictly.
 *
 * @param out Where the results are collected.
 * @param fileScope The source unit's declarations.
 * @param hostNamespace Host-supplied bindings, exposed through `$$`.
 * @returns The evaluator and the lexer pipe in front of it.
 */
function sourcePipes(
  out: Frame,
  fileScope: Frame,
  hostNamespace: Frame,
): { evaluator: EvalPipe; pipe: LexPipe } {
  const evaluator = new EvalPipe(out, fileScope, hostNamespace);
  const pipe = makeSourcePipe(evaluator, {
    importSource: evaluateResourceSource,
    strictStructure: true,
  });
  return { evaluator, pipe };
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
  public static readonly SOURCE = SOURCE_PREFIX;
  /**
   * EXPECT is the output prompt prefix.
   */
  public static readonly EXPECT = EXPECT_PREFIX;

  private evaluator: EvalPipe;
  protected pipe: LexPipe;
  protected lex: Frame;
  private lexicalError: string | null = null;
  private inputBuffer = "";
  private needsFinish = false;

  constructor(
    public readonly out: Frame,
    public readonly fileScope: Frame = out,
    public readonly hostNamespace: Frame = Frame.nil,
  ) {
    const pipes = sourcePipes(out, fileScope, hostNamespace);
    this.evaluator = pipes.evaluator;
    this.pipe = pipes.pipe;
    this.lex = this.pipe;
  }

  /** Reuses this source unit and host while directing results elsewhere. */
  public withOutput(out: Frame): HCEval {
    return new HCEval(out, this.fileScope, this.hostNamespace);
  }

  /** Starts an isolated source unit that shares only the host namespace. */
  public nextSourceUnit(): HCEval {
    return new HCEval(this.out, new Frame(), this.hostNamespace);
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
    const scanned = source.scanInto(this.lex, false);
    const result = endOfLine ? this.pipe.endLine(scanned) : scanned;
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
    } else if (this.needsFinish || this.pipe.level !== 0) {
      const result = this.pipe.finish(Frame.nil);
      complete = result.is.error !== true;
      this.lexicalError = complete ? null : result.toString();
    } else {
      this.lexicalError = null;
    }

    if (!complete) {
      ({ evaluator: this.evaluator, pipe: this.pipe } = sourcePipes(
        this.out,
        this.fileScope,
        this.hostNamespace,
      ));
    }
    this.lex = this.pipe;
    this.inputBuffer = "";
    this.needsFinish = false;
    return complete;
  }

  /** Runtime failures are separate from lexical completion (testdocs may expect them). */
  public hasFailures(): boolean {
    return this.evaluator.failed;
  }

  public error(): string | null {
    return this.lexicalError;
  }

  /**
   * Why `finish` answered false: the lexical error, or a generic reason when
   * the input simply ended mid-form.
   *
   * @returns The reason the source unit is incomplete.
   */
  public incompleteReason(): string {
    return this.error() ?? "incomplete lexical input";
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
