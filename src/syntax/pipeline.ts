import { Frame, FrameString, FrameSymbol } from "../frames";
import * as _ from "lodash";

class Router extends Frame {
};

class Lex extends Frame {
  protected body: string = "";

  public call(argument: Frame, parameter = Frame.nil): Frame {
    if ( this.isEnd(argument.toString()) ) {
      const result = this.makeFrame();
      this.body = "";
      return result;
    }
    this.body = this.body + argument.toString();
    return this;
  }

  public getClassName() {
      var funcNameRegex = /function (.{1,})\(/;
      var results  = (funcNameRegex).exec(this["constructor"].toString());
      return (results && results.length > 1) ? results[1] : "<class>";
  }

  public toString() {
    return this.getClassName() + `[${this.body}]`;
  }

  protected isEnd(char: string) {
    return false;
  }

  protected makeFrame() {
    return Frame.nil;
  }
}

class LexString extends Lex {
  protected isEnd(char: string) {
    return char === "”";
  }

  protected makeFrame() {
    return new FrameString(this.body);
  }
};

class LexComment extends Lex {
  protected isEnd(char: string) {
    return char === "#" || char === "\n";
  }

  protected makeFrame() {
    return FrameSymbol.for("");
  }
};

const router = new Router({
  "“": new LexString(),
  "#": new LexComment(),
});

export const pipe = (input: string): Frame => {
  const output: Frame = _.reduce(input, pipeline, router);
  return output;
};

const pipeline = (current: Frame, char: string): Frame => {
  const frameChar = FrameSymbol.for(char);
  console.log(`*  pipeline ${current}.call(${frameChar})`);
  const next = current.call(frameChar);
  console.log(`** pipeline -> ${next} `);
  return next;
};
