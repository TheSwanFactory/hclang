import { Frame, FrameString, FrameSymbol } from "../frames";

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
    const out = this.get("out");
    console.log(`** exportFrame[${output}] -> ${out}`);
    out.call(output);
    console.log(`*** -> ${out}`);
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
  protected isEnd(char: string) {
    return char === "#" || char === "\n";
  }

  protected makeFrame() {
    return FrameSymbol.for("");
  }
};
