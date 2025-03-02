import {
  Frame,
  FrameString,
  FrameSymbol,
  type IArrayConstructor,
} from "../frames.ts";
import type { ParsePipe } from "./parse-pipe.ts";
import { getSyntax } from "./syntax.ts";
import type { IAction, IFinish, IPerformer } from "./terminals.ts";

function ensure_factory(factory: IArrayConstructor | Frame): IArrayConstructor {
  if (factory instanceof Frame) {
    throw new Error(
      `Expected IArrayConstructor, but received Frame: '${factory}'`,
    );
  }
  return factory;
}

/**
 * The `LexPipe` class extends the `Frame` class and implements the `IFinish` and `IPerformer` interfaces.
 * It is responsible for lexical analysis and transformation of input strings or frames into a sequence of frames.
 *
 * The class maintains a level counter to track the depth of nested frames and provides methods to lex strings,
 * perform actions, and manage the binding and unbinding of parsers.
 *
 * @extends Frame
 * @implements IFinish
 * @implements IPerformer
 *
 * @example
 * // Create a new LexPipe instance with an output frame
 * const lexPipe = new LexPipe(outputFrame);
 *
 * // Lex a string input
 * const resultFrame = lexPipe.lex_string("input string");
 */
export class LexPipe extends Frame implements IFinish, IPerformer {
  /**
   *  @property {number} level - The current level of nested frames.
   */
  public level: number;

  /**
   * @param {Frame} out - The output frame to be used by the LexPipe instance.
   */
  constructor(out: Frame) {
    const syntax = getSyntax();
    syntax[Frame.kOUT] = out;
    super(syntax);
    this.level = 0;
  }

  /**
   * @method lex_string - Converts a string input into a Frame and processes it.
   * @param {string} input - The string input to be lexed.
   * @returns {Frame} - The resulting Frame after lexical analysis.
   */
  public lex_string(input: string): Frame {
    const source = new FrameString(input);
    return this.lex(source);
  }

  /**
   * @method lex - Processes a FrameString input and reduces it.
   * @param {FrameString} source - The FrameString input to be lexed.
   * @returns {Frame} - The resulting Frame after lexical analysis.
   */
  public lex(source: FrameString): Frame {
    return source.reduce(this);
  }

  /**
   * @method finish - Finalizes the LexPipe instance and triggers the next parser.
   * @param {Frame} _parameter - The parameter to be passed to the finish method.
   * @returns {LexPipe} - The current LexPipe instance.
   */
  public finish(_parameter: Frame): LexPipe {
    const next_parser = this.unbind();
    const output = FrameSymbol.end();
    next_parser.call(output);
    return this;
  }

  /**
   * @method unbind - Tries to unbind the most recent parser expression.
   * @param {boolean} [skip=false] - Whether to skip the unbinding process.
   * @returns {ParsePipe} - The next parser after unbinding.
   */ public unbind(skip = false): ParsePipe {
    let next_parser = this.get(Frame.kOUT) as ParsePipe;
    if (!skip) {
      next_parser = next_parser.unbind();
    }
    return next_parser;
  }

  /**
   * // Perform an action on the LexPipe instance
   * lexPipe.perform({ next: true });
   *
   * Action keys can be: "semi-next", "next", "end", "bind", "push", or "pop".
   * The "push" and "pop" actions require a factory as a value.
   * The "end" action requires a terminal Frame as a value.
   *
   * @method perform - Executes a series of actions on the LexPipe instance.
   * @param {IAction} action - The action to be performed.
   * @returns {LexPipe} - The current LexPipe instance.
   */
  public perform(action: IAction): LexPipe {
    for (const [key, value] of Object.entries(action)) {
      const skip = key === "push";
      let parser = this.unbind(skip);
      switch (key) {
        case "semi-next": { // statement (property)
          parser.next(true);
          break;
        }
        case "next": { // expression (enumerable)
          parser.next(false);
          break;
        }
        case "end": { // end of input
          if (value instanceof Frame) {
            parser.finish(value);
          } else {
            console.error(
              `LexPipe.perform.end.failed: value ${value} is not a Frame`,
            );
          }
          break;
        }
        case "bind": { // bind current values into an expression
          parser = parser.bind();
          this.set(Frame.kOUT, parser);
          break;
        }
        case "push": { // push a new factory into the parser
          const factory = ensure_factory(value);
          parser = parser.push(factory);
          this.set(Frame.kOUT, parser);
          this.level += 1;
          break;
        }
        case "pop": { // pop the current factory from the parser
          if (this.level === 0) {
            console.error("LexPipe.perform.pop.failed: already at top level");
            break;
          }
          const factory = ensure_factory(value);
          if (!parser.canPop(factory)) {
            break;
          }
          parser = parser.pop(factory);
          this.set(Frame.kOUT, parser);
          this.level -= 1;
          break;
        }
      }
    }
    return this;
  }
}
