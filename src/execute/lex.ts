import * as _ from "lodash";
import { Frame } from "../frames";

export class Lex extends Frame {

  protected body: string = "";
  protected pass_on = false;

  public call(argument: Frame, parameter = Frame.nil): Frame {
    const char = argument.toString();
    if (this.isEnd(char)) {
      return this.finish(argument);
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

  protected finish(argument: Frame) {
    this.exportFrame();
    this.body = "";
    if (this.pass_on) {
      const result = this.up.call(argument);
      return result;
    }
    return this.up;
  }

  protected exportFrame() {
    const output = this.makeFrame();
    const out = this.get(Frame.kOUT);
    // console.error(`** exportFrame[${output}] -> ${out}`);
    return out.call(output);
  }

  protected makeFrame() {
    return Frame.nil;
  }
}
