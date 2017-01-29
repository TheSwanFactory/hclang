import * as _ from "lodash";
import { Context, Frame, FrameString, FrameSymbol, Void } from "../frames";

export class Lex extends Frame {

  protected body: string = "";

  public call(argument: Frame, parameter = Frame.nil): Frame {
    if ( this.isEnd(argument.toString()) ) {
      this.exportFrame();
      this.body = "";
      return this.up;
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

  protected exportFrame() {
    const output = this.makeFrame();
    const out = this.get(Frame.kOUT);
    // console.error(`** exportFrame[${output}] -> ${out}`);
    out.call(output);
    // console.error(`*** -> ${out}`);
  }

  protected makeFrame() {
    return Frame.nil;
  }
}

export class LexString extends Lex {
  protected isEnd(char: string) {
    return char === "”";
  }

  protected makeFrame() {
    return new FrameString(this.body);
  }
};

export class LexComment extends Lex {
  protected isEnd(char: string) { return char === "#" || char === "\n"; }

  protected makeFrame() { return FrameSymbol.for(""); }
};

export class LexSpace extends Lex {
  protected isEnd(char: string) { return char !== " "; }

  protected makeFrame() { return FrameSymbol.for(""); }
};

const lex_routes: Context = {
  " ": new LexSpace(),
  "#": new LexComment(),
  "“": new LexString(),
};

export class LexPipe extends Frame {
  constructor(out: Frame) {
    lex_routes[Frame.kOUT] = out;
    super(lex_routes);
  }

  public lex_string(input: string) {
    const source = new FrameString(input);
    return this.lex(source);
  }

  public lex(source: FrameString) {
    return source.reduce(this);
  }
}
