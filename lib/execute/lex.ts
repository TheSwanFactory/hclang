/**
 * Generic monadic parser for HC atoms.
 *
 * `syntax.ts` configures one `Lex` with each registered atom factory. After a
 * source character selects that lexer through the `LexPipe` context, `Lex`
 * folds subsequent characters into the atom, emits a `Token` containing the
 * completed frame, and returns control to its parent pipe. `ParsePipe` then
 * aggregates the frame without interpreting its lexical syntax.
 *
 * Atom-specific recognition belongs behind the atom lexical contract. Keep
 * this reducer generic: type tests and branches that encode the syntax of an
 * individual atom undermine the data-driven dispatch established by
 * `getSyntax()`.
 *
 * @module
 */
import {
  type Any,
  Frame,
  FrameAtom,
  FrameBytes,
  FrameComment,
  FrameDoc,
  FrameName,
  FrameOperator,
  FrameQuote,
  type ISourced,
  NilContext,
} from "../frames.ts";
import { LexBytes } from "./lex-bytes.ts";
import { terminals } from "./terminals.ts";

export type Flag = { [key: string]: boolean };

export type AtomFactory = new (body: string) => FrameAtom;
export type BytesFactory = new (body: number[]) => FrameBytes;

export class Token extends FrameAtom {
  constructor(protected data: Frame) {
    super(NilContext);
  }

  public override called_by(callee: Frame, parameter: Frame): Frame {
    return callee.apply(this.data, parameter);
  }

  protected override toData(): Any {
    return this.data;
  }

  public override inspect(): string {
    return `Token[${this.data.inspect()}]`;
  }
}

export class Lex extends Frame implements ISourced {
  public static isTerminal(char: string): boolean {
    const terms = Object.keys(terminals);
    return terms.includes(char);
  }

  public source: string;
  protected body: string = "";
  protected sample: FrameAtom;
  private docDelimiterLevel: 1 | 3 = 1;
  private docOpening = true;
  private docTicks = 1;

  public constructor(protected Factory: AtomFactory) {
    super();
    this.sample = new Factory("");
    this.source = "";
    this.is.void = true;
    const name = this.sample.className();
    this.id = this.id + "." + name;
  }

  public override call(argument: Frame, _parameter = Frame.nil): Frame {
    const char = argument.toString();
    if (this.sample instanceof FrameDoc) {
      return this.callDocument(argument, char);
    }
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

  public override toString(): string {
    return this.id + `[${this.body}]`;
  }

  public isDocument(): boolean {
    return this.sample instanceof FrameDoc;
  }

  protected isEnd(char: string): boolean {
    if (this.Factory !== FrameName || this.body.length === 0) {
      return !this.sample.canInclude(char);
    }
    if (this.sample.canInclude(char)) {
      const startsWithOperator = FrameOperator.Accepts(this.body[0]);
      const continuesIdentifier = char[0] === "-" && !startsWithOperator;
      return !continuesIdentifier &&
        FrameOperator.Accepts(char[0]) !== startsWithOperator;
    }
    return true;
  }

  protected isComment(): boolean {
    return (this.sample instanceof FrameComment);
  }

  protected isQuote(): boolean {
    return (this.sample instanceof FrameQuote);
  }

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

  protected checkRecursive(_argument: Frame): Frame | null {
    if (!(this.sample instanceof FrameBytes)) {
      return null;
    }
    const n = parseInt(this.body, 10);
    const lex = new LexBytes(n, this.up);
    return lex;
  }

  protected exportFrame(): Frame {
    const output: Token = this.makeFrame();
    const out = this.get(Frame.kOUT);
    const result = out.call(output);
    return result;
  }

  protected makeFrame(): Token {
    if (this.body === "") {
      this.body = this.source;
    }
    const delimiterLevel = this.docDelimiterLevel;
    const frame = this.sample instanceof FrameDoc
      ? new FrameDoc(this.body, NilContext, delimiterLevel)
      : new this.Factory(this.body);
    this.body = "";
    if (this.sample instanceof FrameDoc) {
      this.docDelimiterLevel = 1;
      this.docOpening = true;
      this.docTicks = 1;
    }
    return new Token(frame);
  }

  private callDocument(argument: Frame, char: string): Frame {
    const isTick = char === FrameDoc.DOC_END;

    if (this.docOpening) {
      if (isTick) {
        this.docTicks += 1;
        if (this.docTicks === FrameDoc.LONG_DELIMITER_LEVEL) {
          this.docDelimiterLevel = 3;
          this.docOpening = false;
          this.docTicks = 0;
        }
        return this;
      }

      this.docOpening = false;
      if (this.docTicks === 2) {
        return this.finish(argument, true);
      }
      this.docTicks = 0;
    }

    if (this.docDelimiterLevel === 1 && isTick) {
      return this.finish(argument, false);
    }

    if (this.docDelimiterLevel === 3) {
      if (isTick) {
        this.docTicks += 1;
        if (this.docTicks === FrameDoc.LONG_DELIMITER_LEVEL) {
          return this.finish(argument, false);
        }
        return this;
      }
      if (this.docTicks > 0) {
        this.body += FrameDoc.DOC_END.repeat(this.docTicks);
        this.docTicks = 0;
      }
    }

    this.body += char;
    return this;
  }
}
