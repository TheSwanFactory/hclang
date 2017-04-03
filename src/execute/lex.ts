import * as _ from "lodash";
import { Frame, FrameAtom, Void } from "../frames";
import { terminals } from "./terminals";

export class Token extends FrameAtom {
  constructor(protected data: Frame) {
    super(Void);
  }

  public called_by(callee: Frame, parameter: Frame) {
    return callee.apply(this.data, parameter);
  }
  protected toData(): any { return this.data; }
}

export class Lex extends Frame {

  protected body: string = "";
  protected pass_on = false;

  protected constructor(protected factory: any, protected isQuote = false) {
    super();
  }

  public call(argument: Frame, parameter = Frame.nil): Frame {
    const char = argument.toString();
    if (this.isEnd(char)) {
      return this.finish(argument, this.pass_on);
    }

    if (this.isTerminal(char) && !this.isQuoting()) {
      return this.finish(argument, true);
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
    return false;
  }

  protected isTerminal(char: string) {
    const terms = _.keys(terminals);
    return _.includes(terms, char);
  }

  protected isQuoting() {
    return this.isQuote;
  }

  protected finish(argument: Frame, pass: boolean) {
    this.exportFrame();
    if (pass) {
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
    if (this.factory === Frame.nil) {
      return Frame.nil;
    }
    const frame = new this.factory(this.body);
    return new Token(frame);
  }
}
