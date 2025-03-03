import { Frame, FrameBytes, FrameSymbol, type ISourced } from "../frames.ts";
import { Token } from "./lex.ts";

/**
 * The `LexBytes` class extends the `Frame` class and implements the `ISourced` interface.
 * It is responsible for processing a sequence of characters and converting them into their
 * corresponding byte codes.
 */
export class LexBytes extends Frame implements ISourced {
  /**
   * The source string associated with this instance.
   */
  public source: string = "";

  /**
   * An array to store the byte codes of the characters.
   */
  protected body: number[];

  /**
   * Constructs an instance of `LexBytes`.
   *
   * @param count - The number of characters to process.
   * @param up - The parent frame.
   */
  public constructor(protected count: number = 0, up: Frame = Frame.nil) {
    super();
    this.body = [];
    this.is.void = true;
    this.up = up;
  }

  /**
   * Processes the given argument frame. If the argument is the end symbol, it finishes
   * processing. Otherwise, it converts the character to its byte code and stores it.
   *
   * @param argument - The frame containing the character to process.
   * @param _parameter - An optional parameter (default is `Frame.nil`).
   * @returns The current instance or the parent frame if processing is finished.
   */
  public override call(argument: Frame, _parameter = Frame.nil): Frame {
    if (argument === FrameSymbol.end()) {
      return this.finish(argument, false);
    }
    const char = argument.toString();
    const code = char.charCodeAt(0);
    this.body.push(code);
    if (this.body.length === this.count) {
      this.finish(argument, false);
    }
    return this;
  }

  /**
   * Finishes processing and exports the frame.
   *
   * @param _argument - The frame argument (not used).
   * @param _passAlong - A boolean flag (not used).
   * @returns The parent frame.
   */
  protected finish(_argument: Frame, _passAlong: boolean): Frame {
    this.exportFrame();
    return this.up;
  }

  /**
   * Exports the current frame by creating a new frame and calling the output frame.
   *
   * @returns The result of calling the output frame with the new frame.
   */
  protected exportFrame(): Frame {
    const output = this.makeFrame();
    const out = this.get(Frame.kOUT);
    return out.call(output);
  }

  /**
   * Creates a new frame from the stored byte codes. If no byte codes are stored,
   * it returns the end symbol.
   *
   * @returns A new frame containing the byte codes or the end symbol.
   */
  protected makeFrame(): Frame {
    if (this.body.length === 0) {
      return FrameSymbol.end();
    }
    const frame = new FrameBytes(this.body);
    this.body = [];
    return new Token(frame);
  }
}
