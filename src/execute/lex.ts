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
  public pipe: LexPipe = new LexPipe(this);
  protected body: string = "";
  protected sample: FrameAtom;

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
    const frame = new this.Factory(this.body);
    this.body = "";
    return new Token(frame);
  }
}
