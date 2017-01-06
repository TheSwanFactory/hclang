import { Frame, FrameString } from "../frames";
import * as _ from "lodash";

export type Factories = { [key: string]: Function; };

class Router extends Frame {
  public constructor(protected factories: Factories) {
    super();
  }

  public call(argument: Frame, parameter = Frame.nil) {
    return new FrameString("");
  }
};

class SyntaxString extends Frame {

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
  const next = current.call(frameChar);
  //console.log(`pipeline ${next} for ${frameChar}`);
  return next;
};
