import * as _ from "lodash";
import { Frame, FrameAtom, FrameQuote, FrameString, ISourced, NilContext } from "../frames";
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

  public source: string;
  protected body: string = "";
  protected sample: FrameAtom;

  public constructor(protected factory: any) {
    super();
    this.sample = new factory("");
    this.source = "";
  }

  public call(argument: Frame, parameter = Frame.nil): Frame {
    const char = argument.toString();
    if (this.isEnd(char)) {
      return this.finish(argument, !this.isQuote());
    }

    if (this.isTerminal(char) && !this.isQuote()) {
      return this.finish(argument, true);
    }
    if (this.body === "") {
      this.body = this.source;
    }
    this.body = this.body + argument.toString();
    return this;
  }

  public getClassName() {
    const funcNameRegex = /function (.{1,})\(/;
    const results  = (funcNameRegex).exec(this.constructor.toString());
    return (results && results.length > 1) ? results[1] : "<class>";
  }

  public toString() {
    return this.getClassName() + `[${this.body}]`;
  }

  protected isEnd(char: string) {
    return !this.sample.canInclude(char);
  }

  protected isTerminal(char: string) {
    const terms = _.keys(terminals);
    return _.includes(terms, char);
  }

  protected isQuote() {
    return (this.sample instanceof FrameQuote);
  }

  protected finish(argument: Frame, passAlong: boolean) {
    this.exportFrame();
    if (passAlong) {
      const result = this.up.call(argument);
      return result;
    }
    return this.up;
  }

  protected exportFrame() {
    const output = this.makeFrame();
    const out = this.get(Frame.kOUT);
    this.body = "";
    return out.call(output);
  }

  protected makeFrame() {
    const frame = new this.factory(this.body);
    return new Token(frame);
  }
}
