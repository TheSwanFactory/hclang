import { Frame, FrameBytes, FrameSymbol, type ISourced } from "../frames.ts";
import { Token } from "./lex.ts";

export class LexBytes extends Frame implements ISourced {
  public source: string = "";
  protected body: number[];

  public constructor(protected count: number, up: Frame) {
    super();
    this.body = [];
    this.is.void = true;
    this.up = up;
  }

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

  protected finish(_argument: Frame, _passAlong: boolean): Frame {
    this.exportFrame();
    return this.up;
  }

  protected exportFrame(): Frame {
    const output = this.makeFrame();
    const out = this.get(Frame.kOUT);
    return out.call(output);
  }

  protected makeFrame(): Frame {
    if (this.body.length === 0) {
      return FrameSymbol.end();
    }
    const frame = new FrameBytes(this.body);
    this.body = [];
    return new Token(frame);
  }
}
