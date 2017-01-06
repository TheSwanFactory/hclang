import { Frame, FrameString } from "../frames";
import * as _ from "lodash";

export type Factories = { [key: string]: Function; };

class Router extends Frame {
  public constructor(protected factories: Factories) {
    super();
  }

  public call(argument: Frame, parameter = Frame.nil) {
    return new SyntaxString();
  }
};

class SyntaxString extends Frame {
  protected body: Frame = new FrameString("");

  public call(argument: Frame, parameter = Frame.nil): Frame {
    if (argument.toString() === "“””") {
      return this.body;
    }
    this.body = this.body.call(argument);
    return this;
  }

  public toString() {
    return `SyntaxString[${this.body}]`;
  }
};

const router = new Router({
  "“": SyntaxString,
});

export const pipe = (input: string): Frame => {
  const output: Frame = _.reduce(input, pipeline, router);
  return output;
};

const pipeline = (current: Frame, char: string): Frame => {
  const frameChar = new FrameString(char);
  console.log(`*  pipeline ${current}.call(${frameChar})`);
  const next = current.call(frameChar);
  console.log(`** pipeline -> ${next} `);
  return next;
};
