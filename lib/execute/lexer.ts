import { type Any, Frame, FrameString } from "../frames.ts";
import { getSyntax } from "./syntax.ts";

export type LexOptions = { [key: string]: Any };

/**
 * The `Lexer` class extends the `Frame` class and is responsible for lexical analysis.
 * It processes input strings and reduces them to frames.
 */
export class Lexer extends Frame {
  /**
   * Constructs a new `Lexer` instance.
   *
   * @param out - The output frame to be used by the lexer.
   */
  constructor(out: Frame) {
    const syntax = getSyntax();
    syntax[Lexer.kOUT] = out;
    super(syntax);
  }

  /**
   * Lexically analyzes a given input string and returns a frame.
   *
   * @param input - The input string to be lexically analyzed.
   * @returns A frame representing the lexically analyzed input.
   */
  public lex_string(input: string): Frame {
    const source = new FrameString(input);
    return this.lex(source);
  }

  /**
   * Lexically analyzes a given source frame string and returns a frame.
   *
   * @param source - The source frame string to be lexically analyzed.
   * @returns A frame representing the lexically analyzed source.
   */
  public lex(source: FrameString): Frame {
    return source.reduce(this);
  }

  /**
   * Folds the given argument frame into the output frame.
   *
   * @param argument - The argument frame to be folded.
   */
  public fold(argument: Frame): void {
    const out = this.get(Frame.kOUT);
    this.set(Frame.kOUT, out.call(argument));
  }

  /**
   * Completes the lexical analysis process and returns a final frame.
   *
   * @param _options - The options for lexical analysis.
   * @returns A final frame representing the completion of lexical analysis.
   */
  public finish(_options: LexOptions): Frame {
    return Frame.nil;
  }
}
