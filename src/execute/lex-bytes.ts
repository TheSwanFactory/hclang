import * as _ from "lodash";
import { Frame, FrameAtom, FrameBytes, ISourced, NilContext } from "../frames";
import { Token } from "./lex";

export class LexBytes extends Frame implements ISourced {

  public source: string;
  protected body: number[];

  public constructor(protected count: number) {
    super();
    this.body = [];
    this.is.void = true;
  }

  public call(argument: Frame, _parameter = Frame.nil): Frame {
    const char = argument.toString();
    const code = char.charCodeAt(0);
    this.body.push(code);
    if (this.body.length === this.count) {
      this.finish(argument, false);
    }
    return this;
  }

  protected finish(_argument: Frame, _passAlong: boolean) {
    this.exportFrame();
    return this.up;
  }

  protected exportFrame() {
    const output = this.makeFrame();
    const out = this.get(Frame.kOUT);
    this.body = [];
    // debugger;
    return out.call(output);
  }

  protected makeFrame() {
    const frame = new FrameBytes(this.body);
    return new Token(frame);
  }
}
