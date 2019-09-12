import * as _ from "lodash";
import { Frame, FrameAtom, FrameQuote, ISourced, NilContext } from "../frames";
import { LexPipe } from "./lex-pipe";
import { terminals } from "./terminals";

export type Flag = { [key: string]: boolean; };

export class Token extends FrameAtom {
  constructor(protected data: Frame) {
    super(NilContext);
  }

  public called_by(callee: Frame, parameter: Frame) {
    return callee.apply(this.data, parameter);
  }

  protected toData(): any { return this.data; }
}

export class Lex extends Frame implements ISourced {

  public static isTerminal(char: string) {
    const terms = _.keys(terminals);
    return _.includes(terms, char);
  }

  public source: string;
  public pipe: LexPipe;
  protected body: string = "";
  protected sample: FrameAtom;

  public constructor(protected factory: any) {
    super();
    this.sample = new factory("");
    this.source = "";
    this.is.void = true;
    const name = this.sample.constructor.name;
    this.id = this.id + "." + name;
  }

  public call(argument: Frame, parameter = Frame.nil): Frame {
    const char = argument.toString();
    if (this.isEnd(char) && Lex.isTerminal(char)) {
      return this.finish(argument, true);
    }
    if (this.isEnd(char)) {
      return this.finish(argument, !this.isQuote());
    }
    if (Lex.isTerminal(char) && !this.isQuote()) {
      return this.finish(argument, true);
    }
    if (this.body === "") {
      this.body = this.source;
    }
    this.body = this.body + argument.toString();
    return this;
  }

  public toString() {
    return this.id + `[${this.body}]`;
  }

  protected isEnd(char: string) {
    return !this.sample.canInclude(char);
  }

  protected isQuote() {
    return (this.sample instanceof FrameQuote);
  }

  protected finish(argument: Frame, passAlong: boolean) {
    this.exportFrame();
    if (passAlong) {
      this.up.call(argument);
    }
    return this.pipe;
  }

  protected exportFrame() {
    const output = this.makeFrame();
    const out = this.get(Frame.kOUT);
    this.body = "";
    // debugger;
    return out.call(output);
  }

  protected makeFrame() {
    if (this.body === "") {
      this.body = this.source;
    }
    const frame = new this.factory(this.body);
    return new Token(frame);
  }
}
