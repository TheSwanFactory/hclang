import { Frame, FrameString, FrameSymbol } from "../frames";
import * as _ from "lodash";

class Router extends Frame {
};

class LexString extends Frame {
  private body: string = "";

  public call(argument: Frame, parameter = Frame.nil): Frame {
    if (argument.toString() === "”") {
      const result = new FrameString(this.body);
      this.body = "";
      return result;
    }
    this.body = this.body + argument.toString();
    return this;
  }

  public toString() {
    return `LexString[${this.body}]`;
  }
};

class LexComment extends Frame {
  private body: string = "";

  public call(argument: Frame, parameter = Frame.nil): Frame {
    if (argument.toString() === "#") {
      this.body = "";
      return FrameSymbol.for("");
    }
    this.body = this.body + argument.toString();
    return this;
  }

  public toString() {
    return `LexComment[${this.body}]`;
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
