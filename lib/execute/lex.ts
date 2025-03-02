import {
  type Any,
  Frame,
  FrameAtom,
  FrameBytes,
  FrameComment,
  FrameName,
  FrameOperator,
  FrameQuote,
  type ISourced,
  NilContext,
} from "../frames.ts";
import { LexBytes } from "./lex-bytes.ts";
import { LexPipe } from "./lex-pipe.ts";
import { terminals } from "./terminals.ts";

/**
 * Factory to create an Atom from a string
 */
export type AtomFactory = new (body: string) => FrameAtom;

/**
 * Factory to create an Atom from a number array
 */
export type BytesFactory = new (body: number[]) => FrameBytes;

/**
 * UnionFactory is a union of AtomFactory and BytesFactory
 */
export type UnionFactory = AtomFactory | BytesFactory;

/**
 * Represents a Token which extends FrameAtom.
 * A Token is initialized with a Frame data and provides methods to interact with it.
 */
export class Token extends FrameAtom {
  /**
   * Constructs a new Token instance.
   *
   * @param data - The Frame data associated with this Token.
   */
  constructor(protected data: Frame) {
    super(NilContext);
  }

  /**
   * Called by a callee Frame with a parameter Frame.
   *
   * @param callee - The Frame that is calling this method.
   * @param parameter - The Frame parameter passed by the callee.
   * @returns The result of applying the callee to the data and parameter.
   */
  public override called_by(callee: Frame, parameter: Frame): Frame {
    return callee.apply(this.data, parameter);
  }

  /**
   * Converts the Token to its data representation.
   *
   * @returns The Frame data associated with this Token.
   */
  protected override toData(): Any {
    return this.data;
  }

  /**
   * Provides a string representation of the Token.
   *
   * @returns A string that represents the Token.
   */
  public override inspect(): string {
    return `Token[${this.data.inspect()}]`;
  }
}

/**
 * The `Lex` class is responsible for the lexical analysis and tokenization
 * of syntax classes of type AtomFactory.
 *
 * The class provides methods to process characters, identify terminals,
 * handle quoted and commented sections, and manage the state of the
 * lexical analysis process.
 *
 * @extends Frame
 * @implements ISourced
 */
export class Lex extends Frame implements ISourced {
  public static isTerminal(char: string): boolean {
    const terms = Object.keys(terminals);
    return terms.includes(char);
  }

  /**
   * The source string being lexed.
   */
  public source: string;

  /**
   * The default Pipe used for lexing.
   */
  public pipe: LexPipe = new LexPipe(this);

  /**
   * The body of the current token.
   */
  protected body: string = "";

  /**
   * The current sample Atom used for lexing.
   */
  protected sample: FrameAtom;

  /**
   * Constructs a new Lex instance.
   *
   * @param Factory - The AtomFactory to use for lexing.
   */
  public constructor(protected Factory: AtomFactory) {
    super();
    this.sample = new Factory("");
    this.source = "";
    this.is.void = true;
    const name = this.sample.className();
    this.id = this.id + "." + name;
  }

  /**
   * Processes the given argument frame and returns the result.
   * Provides special processing for quoted and commented sections.
   * Ends the token when a terminal is encountered.
   */
  public override call(argument: Frame, _parameter = Frame.nil): Frame {
    const char = argument.toString();
    const end = this.isEnd(char);
    const terminal = Lex.isTerminal(char);
    const not_quote = !this.isQuote();
    const not_space = char !== " ";

    if (end && terminal && not_space) { // ends token on a terminal
      return this.finish(argument, true);
    }
    if (end) { // ends token, but not on a terminal
      const use_arg_for_next_token = not_quote && !this.isComment();
      const result = this.finish(argument, use_arg_for_next_token);
      return result;
    }

    if (terminal && not_quote && not_space) { // unquoted terminal implicitly ends token
      return this.finish(argument, true);
    }

    // otherwise, add to body since still in interior
    // including quoted terminals

    if (this.body === "") {
      this.body = this.source;
    }
    this.body = this.body + argument.toString();
    return this;
  }

  /**
   * String representation of the Lex instance for debugging
   */
  public override toString(): string {
    return this.id + `[${this.body}]`;
  }

  /**
   * Detects whether the current character is the end of the token.
   */
  protected isEnd(char: string): boolean {
    if (this.Factory !== FrameName || this.body.length === 0) {
      return !this.sample.canInclude(char);
    }
    if (this.sample.canInclude(char)) {
      return FrameOperator.Accepts(char[0]) !==
        FrameOperator.Accepts(this.body[0]);
    }
    return true;
  }

  /**
   * Detects whether the current token is a comment.
   */
  protected isComment(): boolean {
    return (this.sample instanceof FrameComment);
  }

  /**
   * Detects whether the current token is a quote.
   */
  protected isQuote(): boolean {
    return (this.sample instanceof FrameQuote);
  }

  /**
   * Finishes the token and exports the frame.
   */
  protected finish(argument: Frame, passAlong: boolean): Frame {
    const recurse = this.checkRecursive(argument);
    if (recurse !== null) {
      return recurse;
    }
    this.exportFrame();
    if (passAlong) {
      const result = this.up.call(argument);
      return result;
    }
    return this.up;
  }

  /**
   * Checks for recursive lexing, e.g. for FrameBytes.
   */
  protected checkRecursive(_argument: Frame): Frame | null {
    if (!(this.sample instanceof FrameBytes)) {
      return null;
    }
    const n = parseInt(this.body, 10);
    console.log("Recursive lexing for FrameBytes: ", n);
    const lex = new LexBytes(n, this.up);
    return lex;
  }

  /**
   * Exports the frame and resets the body.
   */
  protected exportFrame(): Frame {
    const output: Token = this.makeFrame();
    const out = this.get(Frame.kOUT);
    const result = out.call(output);
    return result;
  }

  /**
   * Creates a new frame from the body.
   */
  protected makeFrame(): Token {
    if (this.body === "") {
      this.body = this.source;
    }
    const frame = new this.Factory(this.body);
    this.body = "";
    return new Token(frame);
  }
}
